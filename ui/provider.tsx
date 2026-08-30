import {
  createContext,
  useContext,
  useReducer,
  type PropsWithChildren,
} from "react";
import { redisConnection } from "../server/index";
import { createInitialState, reducer, type AppState } from "./reducer";

type TokaiActions = {
  setRedisUrl: (value: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchQueues: () => Promise<void>;
  fetchJobs: (queueName: string) => Promise<void>;
  showQueues: () => void;
  deleteJob: (jobId: string) => Promise<void>;
  openAddJob: () => void;
  closeAddJob: () => void;
  setNewJobName: (value: string) => void;
  setNewJobData: (value: string) => void;
  addJob: () => Promise<void>;
  obliterateQueue: () => Promise<void>;
};

type TokaiContextValue = {
  state: AppState;
  actions: TokaiActions;
};

const TokaiContext = createContext<TokaiContextValue | null>(null);

export function TokaiProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    reducer,
    redisConnection.isConnected,
    createInitialState,
  );
  const {
    redisUrl,
    selectedQueue,
    deletingJobId,
    newJobName,
    newJobData,
    isAddingJob,
    isObliteratingQueue,
  } = state;

  const fetchQueues = async () => {
    try {
      dispatch({ type: "queuesLoading" });
      const queues = await redisConnection.getQueues();
      dispatch({ type: "queuesLoaded", queues });
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
      const jobs = await redisConnection.getQueueJobs(queueName);
      dispatch({ type: "jobsLoaded", queueName, jobs });
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

  const actions: TokaiActions = {
    setRedisUrl: (value) => dispatch({ type: "redisUrlChanged", value }),
    connect,
    disconnect,
    fetchQueues,
    fetchJobs,
    showQueues,
    deleteJob,
    openAddJob: () => dispatch({ type: "addJobScreenOpened" }),
    closeAddJob: () => dispatch({ type: "addJobScreenClosed" }),
    setNewJobName: (value) => dispatch({ type: "newJobNameChanged", value }),
    setNewJobData: (value) => dispatch({ type: "newJobDataChanged", value }),
    addJob,
    obliterateQueue,
  };

  return (
    <TokaiContext.Provider value={{ state, actions }}>
      {children}
    </TokaiContext.Provider>
  );
}

export function useTokai() {
  const context = useContext(TokaiContext);

  if (!context) {
    throw new Error("useTokai must be used within TokaiProvider.");
  }

  return context;
}
