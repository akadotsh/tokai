import { useState } from "react";
import { redisConnection } from "../server/index";
import { ConnectionForm } from "./components/ConnectionForm";
import { Layout } from "./components/Layout";

export function App() {
  const [redisUrl, setRedisUrl] = useState("");
  const [queues, setQueues] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(redisConnection.isConnected);

  const fetchQueues = async () => {
    try {
      setMessage("Scanning for BullMQ queues...");
      const queueNames = await redisConnection.getQueues();
      setQueues(queueNames);
      setMessage(
        queueNames.length === 0
          ? "No BullMQ queues found."
          : `Found ${queueNames.length} BullMQ queue${queueNames.length === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Could not scan for queues: ${reason}`);
    }
  };

  const connect = async () => {
    const url = redisUrl.trim();

    if (!url) {
      setMessage("Please enter a Redis URL.");
      return;
    }

    if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
      setMessage("Redis URLs must start with redis:// or rediss://");
      return;
    }

    try {
      setMessage("Connecting to Redis...");
      await redisConnection.connect(url);
      setRedisUrl(url);
      setIsConnected(true);
      await fetchQueues();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Could not connect to Redis: ${reason}`);
    }
  };

  const disconnect = async () => {
    try {
      await redisConnection.disconnect();
      setRedisUrl("");
      setQueues([]);
      setMessage("");
      setIsConnected(false);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Could not disconnect from Redis: ${reason}`);
    }
  };

  if (isConnected) {
    return (
      <Layout
        queues={queues}
        message={message}
        onDisconnect={disconnect}
        onRefresh={fetchQueues}
      />
    );
  }

  return (
    <ConnectionForm
      redisUrl={redisUrl}
      message={message}
      onRedisUrlChange={(value) => {
        setRedisUrl(value);
        setMessage("");
      }}
      onSubmit={connect}
    />
  );
}
