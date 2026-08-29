import { RedisClient } from "bun";
import { IRedisClient, Queue, createBunRedisClient } from "bullmq";

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
    console.log("BullMQ queues:", queueNames);

    return queueNames;
  }
}

export const redisConnection = new RedisConnection();
