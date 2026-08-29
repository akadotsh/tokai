import { RedisClient } from "bun";
import { IRedisClient, Queue, createBunRedisClient } from "bullmq";

export type JobCounts = {
  name: string;
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
    await this.connection?.disconnect();
    this.connection = null;
    this.isConnected = false;
    console.log("Disconnected");
  }

  async getQueues() {
    if (!this.connection) {
      throw new Error("Connect to Redis before scanning for queues.");
    }

    const queues = new Set<string>();
    let cursor = "0";

    do {
      const [nextCursor, keys] = await this.connection.scan(cursor, {
        MATCH: "bull:*:meta",
        COUNT: 100,
      });

      cursor = nextCursor;

      for (const key of keys) {
        const match = key.match(/^bull:(.+):meta$/);

        if (match?.[1]) {
          queues.add(match[1]);
        }
      }
    } while (cursor !== "0");

    const queueNames = [...queues].sort();
    const jobCounts: JobCounts[] = await Promise.all(
      queueNames.map(async (name) => ({
        name,
        counts: await this.getQueueJobCounts(name),
      })),
    );
    console.log("BullMQ job counts:", jobCounts);

    return jobCounts;
  }

  async getQueueJobCounts(queueName: string) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching job counts.");
    }

    const queue = new Queue(queueName, {
      connection: this.connection.duplicate(),
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

  async getQueueJobs(queueName: string) {
    if (!this.connection) {
      throw new Error("Connect to Redis before fetching jobs.");
    }

    const queue = new Queue(queueName, {
      connection: this.connection.duplicate(),
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
}

export const redisConnection = new RedisConnection();
