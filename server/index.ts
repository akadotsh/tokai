import { RedisClient } from "bun";
import {
  IRedisClient,
  Queue,
  createBunRedisClient,
  type QueueMeta,
} from "bullmq";

export type QueueRef = {
  name: string;
  prefix: string;
};

export type JobCounts = QueueRef & {
  meta: QueueMeta;
  counts: Record<QueueJobStatus, number>;
};

export type QueueJobStatus =
  | "completed"
  | "failed"
  | "delayed"
  | "active"
  | "wait"
  | "waiting-children"
  | "prioritized"
  | "paused"
  | "repeat";

export type QueueJobSummary = {
  id: string;
  name: string;
  status: QueueJobStatus;
  timestamp: number;
  data: unknown;
};

const queueJobStatuses: QueueJobStatus[] = [
  "completed",
  "failed",
  "delayed",
  "active",
  "wait",
  "waiting-children",
  "prioritized",
  "paused",
  "repeat",
];

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
      const getJobCounts = queue.getJobCounts.bind(queue) as (
        ...types: QueueJobStatus[]
      ) => Promise<Record<string, number>>;
      const counts = await getJobCounts(...queueJobStatuses);

      return Object.fromEntries(
        queueJobStatuses.map((status) => [status, counts[status] ?? 0]),
      ) as Record<QueueJobStatus, number>;
    } finally {
      await queue.close();
    }
  }

  async getQueueJobs(queueRef: QueueRef) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching jobs.");
    }

    const queue = new Queue(queueRef.name, {
      connection: this.connection.duplicate(),
      prefix: queueRef.prefix,
      skipMetasUpdate: true,
    });

    try {
      const getJobs = queue.getJobs.bind(queue) as (
        types: QueueJobStatus[],
        start: number,
        end: number,
        asc: boolean,
      ) => Promise<
        Array<{
          id?: string;
          name: string;
          timestamp: number;
          data: unknown;
        }>
      >;
      const jobsByStatus = await Promise.all(
        queueJobStatuses.map(async (status) => {
          const jobs = await getJobs([status], 0, 99, true);
          console.log("JOBS", jobs);
          return jobs.map(
            (job): QueueJobSummary => ({
              id: job.id ?? "(no id)",
              name: job.name,
              status,
              timestamp: job.timestamp,
              data: job.data,
            }),
          );
        }),
      );

      return jobsByStatus.flat();
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
}

export const redisConnection = new RedisConnection();
