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
    isAddJobScreenOpen,
    newJobName,
    newJobData,
    isAddingJob,
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
    if (
      !selectedQueue ||
      deletingJobId ||
      isAddingJob ||
      isObliteratingQueue
    ) {
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

  const addJob = async () => {
    if (
      !selectedQueue ||
      isAddingJob ||
      deletingJobId ||
      isObliteratingQueue
    ) {
      return;
    }

    const name = newJobName.trim();

    if (!name) {
      dispatch({ type: "jobAddFailed", message: "Enter a job name." });
      return;
    }

    let data: unknown;

    try {
      data = JSON.parse(newJobData);
    } catch {
      dispatch({ type: "jobAddFailed", message: "Job data must be valid JSON." });
      return;
    }

    dispatch({ type: "jobAddStarted" });

    try {
      const job = await redisConnection.addQueueJob(selectedQueue, name, data);
      dispatch({ type: "jobAdded", job });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobAddFailed",
        message: `Could not add job: ${reason}`,
      });
    }
  };

  const obliterateQueue = async () => {
    if (
      !selectedQueue ||
      isObliteratingQueue ||
      deletingJobId ||
      isAddingJob
    ) {
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
        isAddJobScreenOpen={isAddJobScreenOpen}
        newJobName={newJobName}
        newJobData={newJobData}
        isAddingJob={isAddingJob}
        isObliteratingQueue={isObliteratingQueue}
        onDisconnect={disconnect}
        onRefresh={fetchQueues}
        onQueueSelect={fetchJobs}
        onBackToQueues={showQueues}
        onDeleteJob={deleteJob}
        onOpenAddJob={() => dispatch({ type: "addJobScreenOpened" })}
        onCloseAddJob={() => dispatch({ type: "addJobScreenClosed" })}
        onNewJobNameChange={(value) =>
          dispatch({ type: "newJobNameChanged", value })
        }
        onNewJobDataChange={(value) =>
          dispatch({ type: "newJobDataChanged", value })
        }
        onAddJob={addJob}
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
