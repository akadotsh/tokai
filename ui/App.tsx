import { useReducer } from "react";
import { redisConnection } from "../server/index";
import { ConnectionForm } from "./components/ConnectionForm";
import { Layout } from "./components/Layout";
import { createInitialState, reducer } from "./reducer";

export function App() {
  const [state, dispatch] = useReducer(
    reducer,
    redisConnection.isConnected,
    createInitialState,
  );
  const {
    redisUrl,
    queues,
    selectedQueue,
    jobs,
    jobsMessage,
    isLoadingJobs,
    deletingJobId,
    isObliteratingQueue,
    message,
    isConnected,
  } = state;

  const fetchQueues = async () => {
    try {
      dispatch({ type: "queuesLoading" });
      const jobCounts = await redisConnection.getQueues();
      dispatch({ type: "queuesLoaded", queues: jobCounts });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queuesFailed",
        message: `Could not scan for queues: ${reason}`,
      });
    }
  };

  const connect = async () => {
    const url = redisUrl.trim();

    if (!url) {
      dispatch({ type: "messageSet", message: "Please enter a Redis URL." });
      return;
    }

    if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
      dispatch({
        type: "messageSet",
        message: "Redis URLs must start with redis:// or rediss://",
      });
      return;
    }

    try {
      dispatch({ type: "messageSet", message: "Connecting to Redis..." });
      await redisConnection.connect(url);
      dispatch({ type: "connected", redisUrl: url });
      await fetchQueues();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "messageSet",
        message: `Could not connect to Redis: ${reason}`,
      });
    }
  };

  const disconnect = async () => {
    try {
      await redisConnection.disconnect();
      dispatch({ type: "disconnected" });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "messageSet",
        message: `Could not disconnect from Redis: ${reason}`,
      });
    }
  };

  const fetchJobs = async (queueName: string) => {
    dispatch({ type: "jobsLoading", queueName });

    try {
      const queueJobs = await redisConnection.getQueueJobs(queueName);
      dispatch({ type: "jobsLoaded", queueName, jobs: queueJobs });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobsFailed",
        queueName,
        message: `Could not fetch jobs: ${reason}`,
      });
    }
  };

  const showQueues = () => {
    dispatch({ type: "showQueues" });
    void fetchQueues();
  };

  const deleteJob = async (jobId: string) => {
    if (!selectedQueue || deletingJobId || isObliteratingQueue) {
      return;
    }

    dispatch({ type: "jobDeleteStarted", jobId });

    try {
      await redisConnection.removeQueueJob(selectedQueue, jobId);
      dispatch({ type: "jobDeleted", jobId });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobDeleteFailed",
        jobId,
        message: `Could not delete job: ${reason}`,
      });
    }
  };

  const obliterateQueue = async () => {
    if (!selectedQueue || isObliteratingQueue || deletingJobId) {
      return;
    }

    const queueName = selectedQueue;
    dispatch({ type: "queueObliterateStarted" });

    try {
      await redisConnection.obliterateQueue(queueName);
      dispatch({ type: "queueObliterated", queueName });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueObliterateFailed",
        message: `Could not obliterate queue: ${reason}`,
      });
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
        isObliteratingQueue={isObliteratingQueue}
        onDisconnect={disconnect}
        onRefresh={fetchQueues}
        onQueueSelect={fetchJobs}
        onBackToQueues={showQueues}
        onDeleteJob={deleteJob}
        onObliterateQueue={obliterateQueue}
      />
    );
  }

  return (
    <ConnectionForm
      redisUrl={redisUrl}
      message={message}
      onRedisUrlChange={(value) => dispatch({ type: "redisUrlChanged", value })}
      onSubmit={connect}
    />
  );
}
