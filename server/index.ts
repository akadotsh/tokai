import { RedisClient } from "bun";
import {
  IRedisClient,
  Queue,
  createBunRedisClient,
  type JobType,
  type QueueMeta,
} from "bullmq";

export type QueueRef = {
  name: string;
  prefix: string;
};

export const queueJobStatuses = [
  "completed",
  "failed",
  "delayed",
  "active",
  "wait",
  "waiting-children",
  "prioritized",
  "repeat",
] as const satisfies readonly JobType[];

export type QueueJobStatus = (typeof queueJobStatuses)[number];
export type RetryableJobState = "failed" | "completed";

export type JobCounts = QueueRef & {
  meta: QueueMeta;
  counts: Record<QueueJobStatus, number>;
};

export type QueueJobSummary = {
  id: string;
  name: string;
  status: QueueJobStatus;
  timestamp: number;
  data: unknown;
};

export type QueueJobsPage = {
  jobs: QueueJobSummary[];
  page: number;
  pageSize: number;
  status: QueueJobStatus | null;
  total: number;
  hasNextPage: boolean;
};

export type QueueJobDetails = {
  id: string;
  name: string;
  state: string;
  data: unknown;
  options: unknown;
  progress: unknown;
  returnValue: unknown;
  failedReason: string | null;
  stackTrace: string[];
  attemptsMade: number;
  attemptsStarted: number;
  stalledCounter: number;
  delay: number;
  priority: number;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
  processedBy: string | null;
  logs: string[];
  logsCount: number;
};

class RedisConnection {
  isConnected: boolean = false;
  connection: IRedisClient | null = null;

  async connect(url: string) {
    const rawClient = new RedisClient(url);
    const connection = createBunRedisClient(rawClient, {
      lazyConnect: true,
    });

    await connection.connect();
    this.connection = connection;
    this.isConnected = true;
    console.log("Redis connection status:", connection.status);
  }

  async disconnect() {
    this.connection?.disconnect();
    this.connection = null;
    this.isConnected = false;
    console.log("Disconnected");
  }

  async getQueues() {
    if (!this.connection) {
      throw new Error("Connect to Redis before scanning for queues.");
    }

    const queues = new Map<string, QueueRef>();
    let cursor = "0";

    do {
      const [nextCursor, keys] = await this.connection.scan(cursor, {
        MATCH: "*:*:meta",
        COUNT: 100,
      });

      cursor = nextCursor;

      for (const key of keys) {
        const match = key.match(/^(.+):([^:]+):meta$/);

        if (match?.[1] && match[2]) {
          const prefix = match[1];
          const name = match[2];
          queues.set(`${prefix}:${name}`, { prefix, name });
        }
      }
    } while (cursor !== "0");

    const queueRefs = [...queues.values()].sort(
      (left, right) =>
        left.prefix.localeCompare(right.prefix) ||
        left.name.localeCompare(right.name),
    );

    const jobCounts: JobCounts[] = await Promise.all(
      queueRefs.map(async (queue) => {
        const [meta, counts] = await Promise.all([
          this.getQueueMeta(queue),
          this.getQueueJobCounts(queue),
        ]);

        return { ...queue, meta, counts };
      }),
    );

    return jobCounts;
  }

  async getQueueMeta(queueRef: QueueRef) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching queue meta.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      return await queue.getMeta();
    } finally {
      await queue.close();
    }
  }

  async getQueueJobCounts(queueRef: QueueRef) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching job counts.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const counts = await queue.getJobCounts(...queueJobStatuses);

      return Object.fromEntries(
        queueJobStatuses.map((status) => [status, counts[status] ?? 0]),
      ) as Record<QueueJobStatus, number>;
    } finally {
      await queue.close();
    }
  }

  async getQueueJobs(
    queueRef: QueueRef,
    page: number,
    pageSize: number,
    status: QueueJobStatus | null = null,
  ) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching jobs.");
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new Error("Job page must be a positive integer.");
    }

    if (!Number.isInteger(pageSize) || pageSize < 1) {
      throw new Error("Job page size must be a positive integer.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const statuses: QueueJobStatus[] = status
        ? [status]
        : [...queueJobStatuses];
      const counts = await queue.getJobCounts(...statuses);
      const total = statuses.reduce(
        (sum, currentStatus) => sum + (counts[currentStatus] ?? 0),
        0,
      );
      const pageStart = (page - 1) * pageSize;
      const pageEnd = pageStart + pageSize;
      let statusStart = 0;
      const jobsByStatus = await Promise.all(
        statuses.map(async (currentStatus) => {
          const statusCount = counts[currentStatus] ?? 0;
          const start = Math.max(0, pageStart - statusStart);
          const end = Math.min(statusCount, pageEnd - statusStart) - 1;
          statusStart += statusCount;

          if (start > end) return [];

          const jobs = await queue.getJobs([currentStatus], start, end, true);
          return jobs.map(
            (job): QueueJobSummary => ({
              id: job.id ?? "(no id)",
              name: job.name,
              status: currentStatus,
              timestamp: job.timestamp,
              data: job.data,
            }),
          );
        }),
      );

      return {
        jobs: jobsByStatus.flat(),
        page,
        pageSize,
        status,
        total,
        hasNextPage: pageEnd < total,
      } satisfies QueueJobsPage;
    } finally {
      await queue.close();
    }
  }

  async removeQueueJob(queueRef: QueueRef, jobId: string) {
    if (!this.connection) {
      throw new Error("Connect to Redis before deleting a job.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const removed = await queue.remove(jobId);

      if (removed === 0) {
        throw new Error(`Job "${jobId}" was not found or is currently locked.`);
      }
    } finally {
      await queue.close();
    }
  }

  async retryQueueJob(queueRef: QueueRef, jobId: string) {
    if (!this.connection) {
      throw new Error("Connect to Redis before retrying a job.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const job = await queue.getJob(jobId);

      if (!job) {
        throw new Error(`Job "${jobId}" was not found.`);
      }

      const state = await job.getState();

      if (state !== "failed" && state !== "completed") {
        throw new Error(
          `Job "${jobId}" cannot be retried while it is ${state}.`,
        );
      }

      await job.retry(state);
    } finally {
      await queue.close();
    }
  }

  async getQueueJobDetails(queueRef: QueueRef, jobId: string) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching job details.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const job = await queue.getJob(jobId);

      if (!job) {
        throw new Error(`Job "${jobId}" was not found.`);
      }

      const [state, jobLogs] = await Promise.all([
        job.getState(),
        queue.getJobLogs(jobId, 0, -1, true),
      ]);

      return {
        id: job.id ?? jobId,
        name: job.name,
        state,
        data: job.data,
        options: job.opts,
        progress: job.progress,
        returnValue: job.returnvalue,
        failedReason: job.failedReason || null,
        stackTrace: job.stacktrace ?? [],
        attemptsMade: job.attemptsMade,
        attemptsStarted: job.attemptsStarted,
        stalledCounter: job.stalledCounter,
        delay: job.delay,
        priority: job.priority,
        timestamp: job.timestamp,
        processedOn: job.processedOn ?? null,
        finishedOn: job.finishedOn ?? null,
        processedBy: job.processedBy ?? null,
        logs: jobLogs.logs,
        logsCount: jobLogs.count,
      } satisfies QueueJobDetails;
    } finally {
      await queue.close();
    }
  }

  async addQueueJob(queueRef: QueueRef, name: string, data: unknown) {
    if (!this.connection) {
      throw new Error("Connect to Redis before adding a job.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const job = await queue.add(name, data);

      return {
        id: job.id ?? "(no id)",
        name: job.name,
        status: "wait",
        timestamp: job.timestamp,
        data: job.data,
      } satisfies QueueJobSummary;
    } finally {
      await queue.close();
    }
  }

  async obliterateQueue(queueRef: QueueRef) {
    if (!this.connection) {
      throw new Error("Connect to Redis before obliterating a queue.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      await queue.obliterate();
    } finally {
      await queue.close();
    }
  }

  async drainQueue(queueRef: QueueRef) {
    if (!this.connection) {
      throw new Error("Connect to Redis before emptying a queue.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      await queue.drain(true);
    } finally {
      await queue.close();
    }
  }

  async retryJobs(queueRef: QueueRef, state: RetryableJobState) {
    if (!this.connection) {
      throw new Error("Connect to Redis before retrying jobs.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      await queue.retryJobs({ state });
    } finally {
      await queue.close();
    }
  }

  async rateLimitQueue(queueRef: QueueRef, durationMs: number) {
    if (!this.connection) {
      throw new Error("Connect to Redis before rate limiting a queue.");
    }

    if (!Number.isInteger(durationMs) || durationMs <= 0) {
      throw new Error("Rate limit duration must be a positive integer.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      await queue.rateLimit(durationMs);
    } finally {
      await queue.close();
    }
  }
}

export const redisConnection = new RedisConnection();
