import { useState } from "react";
import {
  redisConnection,
  type JobCounts,
  type QueueJobSummary,
} from "../server/index";
import { ConnectionForm } from "./components/ConnectionForm";
import { Layout } from "./components/Layout";

export function App() {
  const [redisUrl, setRedisUrl] = useState("");
  const [queues, setQueues] = useState<JobCounts[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [jobs, setJobs] = useState<QueueJobSummary[]>([]);
  const [jobsMessage, setJobsMessage] = useState("");
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(redisConnection.isConnected);

  const fetchQueues = async () => {
    try {
      setMessage("Scanning for BullMQ queues...");
      const jobCounts = await redisConnection.getQueues();
      setQueues(jobCounts);
      setMessage(
        jobCounts.length === 0
          ? "No BullMQ queues found."
          : `Found ${jobCounts.length} BullMQ queue${jobCounts.length === 1 ? "" : "s"}.`,
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
      setSelectedQueue(null);
      setJobs([]);
      setJobsMessage("");
      setIsLoadingJobs(false);
      setDeletingJobId(null);
      setMessage("");
      setIsConnected(false);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Could not disconnect from Redis: ${reason}`);
    }
  };

  const fetchJobs = async (queueName: string) => {
    setSelectedQueue(queueName);
    setJobs([]);
    setJobsMessage("");
    setIsLoadingJobs(true);

    try {
      const queueJobs = await redisConnection.getQueueJobs(queueName);
      setJobs(queueJobs);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setJobsMessage(`Could not fetch jobs: ${reason}`);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const showQueues = () => {
    setSelectedQueue(null);
    setJobs([]);
    setJobsMessage("");
    setIsLoadingJobs(false);
    setDeletingJobId(null);
    void fetchQueues();
  };

  const deleteJob = async (jobId: string) => {
    if (!selectedQueue || deletingJobId) {
      return;
    }

    setDeletingJobId(jobId);
    setJobsMessage("");

    try {
      await redisConnection.removeQueueJob(selectedQueue, jobId);
      setJobs((currentJobs) =>
        currentJobs.filter((job) => job.id !== jobId),
      );
      setJobsMessage(`Deleted job "${jobId}".`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setJobsMessage(`Could not delete job: ${reason}`);
    } finally {
      setDeletingJobId(null);
    }
  };

  if (isConnected) {
    return (
      <Layout
        queues={queues}
        message={message}
        selectedQueue={selectedQueue}
        jobs={jobs}
        jobsMessage={jobsMessage}
        isLoadingJobs={isLoadingJobs}
        deletingJobId={deletingJobId}
        onDisconnect={disconnect}
        onRefresh={fetchQueues}
        onQueueSelect={fetchJobs}
        onBackToQueues={showQueues}
        onDeleteJob={deleteJob}
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
