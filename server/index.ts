import { RedisClient } from "bun";
import { IRedisClient, createBunRedisClient } from "bullmq";

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
}

export const redisConnection = new RedisConnection();
