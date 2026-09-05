import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type PropsWithChildren,
} from "react";
import {
  redisConnection,
  type QueueJobStatus,
  type QueueRef,
  type RetryableJobState,
} from "../server/index";
import { createInitialState, reducer, type AppState } from "./reducer";

type TokaiActions = {
  setRedisUrl: (value: string) => void;
  setPollingInterval: (value: number) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchQueues: () => Promise<void>;
  fetchJobs: (
    queue: QueueRef,
    page?: number,
    status?: QueueJobStatus | null,
    searchQuery?: string,
  ) => Promise<void>;
  filterJobsByStatus: (status: QueueJobStatus | null) => Promise<void>;
  searchJobs: (query: string) => Promise<void>;
  showPreviousJobsPage: () => Promise<void>;
  showNextJobsPage: () => Promise<void>;
  showQueues: () => void;
  openJobDetails: (jobId: string) => Promise<void>;
  closeJobDetails: () => void;
  deleteJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  openAddJob: () => void;
  closeAddJob: () => void;
  setNewJobName: (value: string) => void;
  setNewJobData: (value: string) => void;
  addJob: () => Promise<void>;
  drainQueue: () => Promise<void>;
  retryJobs: (state: RetryableJobState) => Promise<void>;
  setQueuePaused: (queue: QueueRef, paused: boolean) => Promise<void>;
  setQueueConcurrency: (concurrency: number) => Promise<void>;
  rateLimitQueue: (durationMs: number) => Promise<void>;
  obliterateQueue: () => Promise<void>;
};

type TokaiContextValue = {
  state: AppState;
  actions: TokaiActions;
};

const TokaiContext = createContext<TokaiContextValue | null>(null);
const JOBS_PAGE_SIZE = 10;

export function TokaiProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    reducer,
    redisConnection.isConnected,
    createInitialState,
  );
  const {
    redisUrl,
    pollingIntervalMs,
    selectedQueue,
    jobsPage,
    hasNextJobsPage,
    jobsStatusFilter,
    jobsSearchQuery,
    isLoadingJobs,
    deletingJobId,
    retryingJobId,
    newJobName,
    newJobData,
    isAddingJob,
    isDrainingQueue,
    isRetryingJobs,
    changingQueueStatus,
    isSettingQueueConcurrency,
    isRateLimitingQueue,
    isObliteratingQueue,
    isConnected,
  } = state;

  useEffect(() => {
    if (
      !isConnected ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isSettingQueueConcurrency ||
      isObliteratingQueue ||
      isLoadingJobs
    ) {
      return;
    }

    let isActive = true;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        const queues = await redisConnection.getQueues();

        if (!isActive) return;
        dispatch({ type: "queuesRefreshed", queues });

        if (selectedQueue) {
          const queueStillExists = queues.some(
            (queue) =>
              queue.name === selectedQueue.name &&
              queue.prefix === selectedQueue.prefix,
          );

          if (!queueStillExists) {
            dispatch({ type: "selectedQueueMissing", queue: selectedQueue });
            return;
          }

          const result = await redisConnection.getQueueJobs(
            selectedQueue,
            jobsPage,
            JOBS_PAGE_SIZE,
            jobsStatusFilter,
            jobsSearchQuery,
          );

          if (isActive) {
            dispatch({ type: "jobsRefreshed", queue: selectedQueue, result });
          }
        }
      } catch {
        // Keep the current screen stable when a background refresh fails.
      } finally {
        isPolling = false;
      }
    };

    const interval = setInterval(() => void poll(), pollingIntervalMs);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [
    deletingJobId,
    retryingJobId,
    isAddingJob,
    isConnected,
    isDrainingQueue,
    isRetryingJobs,
    changingQueueStatus,
    isSettingQueueConcurrency,
    isLoadingJobs,
    isObliteratingQueue,
    jobsPage,
    jobsSearchQuery,
    jobsStatusFilter,
    pollingIntervalMs,
    selectedQueue?.name,
    selectedQueue?.prefix,
  ]);

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

  const fetchJobs = async (
    queue: QueueRef,
    page = 1,
    status: QueueJobStatus | null = null,
    searchQuery = "",
  ) => {
    const query = searchQuery.trim();
    dispatch({ type: "jobsLoading", queue, page, status, searchQuery: query });

    try {
      const result = await redisConnection.getQueueJobs(
        queue,
        page,
        JOBS_PAGE_SIZE,
        status,
        query,
      );
      dispatch({ type: "jobsLoaded", queue, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobsFailed",
        queue,
        page,
        status,
        searchQuery: query,
        message: `Could not fetch jobs: ${reason}`,
      });
    }
  };

  const filterJobsByStatus = async (status: QueueJobStatus | null) => {
    if (
      !selectedQueue ||
      status === jobsStatusFilter ||
      isLoadingJobs ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue
    ) {
      return;
    }

    await fetchJobs(selectedQueue, 1, status, jobsSearchQuery);
  };

  const searchJobs = async (searchQuery: string) => {
    const query = searchQuery.trim();

    if (
      !selectedQueue ||
      query === jobsSearchQuery ||
      isLoadingJobs ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue
    ) {
      return;
    }

    await fetchJobs(selectedQueue, 1, jobsStatusFilter, query);
  };

  const showPreviousJobsPage = async () => {
    if (
      !selectedQueue ||
      jobsPage <= 1 ||
      isLoadingJobs ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue
    ) {
      return;
    }
    await fetchJobs(
      selectedQueue,
      jobsPage - 1,
      jobsStatusFilter,
      jobsSearchQuery,
    );
  };

  const showNextJobsPage = async () => {
    if (
      !selectedQueue ||
      !hasNextJobsPage ||
      isLoadingJobs ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue
    ) {
      return;
    }
    await fetchJobs(
      selectedQueue,
      jobsPage + 1,
      jobsStatusFilter,
      jobsSearchQuery,
    );
  };

  const showQueues = () => {
    dispatch({ type: "showQueues" });
    void fetchQueues();
  };

  const openJobDetails = async (jobId: string) => {
    if (
      !selectedQueue ||
      deletingJobId ||
      retryingJobId ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "jobDetailsLoading", jobId });

    try {
      const details = await redisConnection.getQueueJobDetails(queue, jobId);
      dispatch({ type: "jobDetailsLoaded", jobId, details });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobDetailsFailed",
        jobId,
        message: `Could not fetch job details: ${reason}`,
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    if (
      !selectedQueue ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
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

  const retryJob = async (jobId: string) => {
    if (
      !selectedQueue ||
      retryingJobId ||
      deletingJobId ||
      isAddingJob ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "jobRetryStarted", jobId });

    try {
      await redisConnection.retryQueueJob(queue, jobId);
      const result = await redisConnection.getQueueJobs(
        queue,
        1,
        JOBS_PAGE_SIZE,
        jobsStatusFilter,
        jobsSearchQuery,
      );
      dispatch({ type: "jobRetried", queue, jobId, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobRetryFailed",
        jobId,
        message: `Could not retry job: ${reason}`,
      });
    }
  };

  const addJob = async () => {
    if (
      !selectedQueue ||
      isAddingJob ||
      deletingJobId ||
      retryingJobId ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
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
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueObliterateStarted" });

    try {
      await redisConnection.obliterateQueue(queue);
      dispatch({ type: "queueObliterated", queue });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueObliterateFailed",
        message: `Could not obliterate queue: ${reason}`,
      });
    }
  };

  const drainQueue = async () => {
    if (
      !selectedQueue ||
      isDrainingQueue ||
      isObliteratingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueDrainStarted" });

    try {
      await redisConnection.drainQueue(queue);
      const result = await redisConnection.getQueueJobs(
        queue,
        1,
        JOBS_PAGE_SIZE,
        jobsStatusFilter,
        jobsSearchQuery,
      );
      dispatch({ type: "queueDrained", queue, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueDrainFailed",
        message: `Could not empty queue: ${reason}`,
      });
    }
  };

  const retryJobs = async (state: RetryableJobState) => {
    if (
      !selectedQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isRateLimitingQueue ||
      isDrainingQueue ||
      isObliteratingQueue ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "jobsRetryStarted" });

    try {
      await redisConnection.retryJobs(queue, state);
      const result = await redisConnection.getQueueJobs(
        queue,
        1,
        JOBS_PAGE_SIZE,
        jobsStatusFilter,
        jobsSearchQuery,
      );
      dispatch({ type: "jobsRetried", queue, state, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "jobsRetryFailed",
        message: `Could not retry ${state} jobs: ${reason}`,
      });
    }
  };

  const setQueuePaused = async (queue: QueueRef, paused: boolean) => {
    if (
      changingQueueStatus ||
      isDrainingQueue ||
      isRetryingJobs ||
      isObliteratingQueue ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob
    ) {
      return;
    }

    dispatch({ type: "queueStatusChangeStarted", queue });

    try {
      await redisConnection.setQueuePaused(queue, paused);
      const [meta, counts] = await Promise.all([
        redisConnection.getQueueMeta(queue),
        redisConnection.getQueueJobCounts(queue),
      ]);
      dispatch({
        type: "queueStatusChanged",
        queue,
        paused,
        queueInfo: { ...queue, meta, counts },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueStatusChangeFailed",
        queue,
        message: `Could not ${paused ? "pause" : "resume"} queue: ${reason}`,
      });
    }
  };

  const rateLimitQueue = async (durationMs: number) => {
    if (
      !selectedQueue ||
      isRateLimitingQueue ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueRateLimitStarted" });

    try {
      await redisConnection.rateLimitQueue(queue, durationMs);
      dispatch({ type: "queueRateLimited", queue, durationMs });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueRateLimitFailed",
        message: `Could not rate limit queue: ${reason}`,
      });
    }
  };

  const setQueueConcurrency = async (concurrency: number) => {
    if (
      !selectedQueue ||
      isSettingQueueConcurrency ||
      isRateLimitingQueue ||
      isDrainingQueue ||
      isRetryingJobs ||
      changingQueueStatus ||
      isObliteratingQueue ||
      deletingJobId ||
      retryingJobId ||
      isAddingJob
    ) {
      return;
    }

    const queue = selectedQueue;
    dispatch({ type: "queueConcurrencySetStarted" });

    try {
      await redisConnection.setQueueConcurrency(queue, concurrency);
      const [meta, counts] = await Promise.all([
        redisConnection.getQueueMeta(queue),
        redisConnection.getQueueJobCounts(queue),
      ]);
      dispatch({
        type: "queueConcurrencySet",
        queue,
        concurrency,
        queueInfo: { ...queue, meta, counts },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      dispatch({
        type: "queueConcurrencySetFailed",
        message: `Could not set queue concurrency: ${reason}`,
      });
    }
  };

  const actions: TokaiActions = {
    setRedisUrl: (value) => dispatch({ type: "redisUrlChanged", value }),
    setPollingInterval: (value) =>
      dispatch({ type: "pollingIntervalChanged", value }),
    connect,
    disconnect,
    fetchQueues,
    fetchJobs,
    filterJobsByStatus,
    searchJobs,
    showPreviousJobsPage,
    showNextJobsPage,
    showQueues,
    openJobDetails,
    closeJobDetails: () => dispatch({ type: "jobDetailsClosed" }),
    deleteJob,
    retryJob,
    openAddJob: () => dispatch({ type: "addJobScreenOpened" }),
    closeAddJob: () => dispatch({ type: "addJobScreenClosed" }),
    setNewJobName: (value) => dispatch({ type: "newJobNameChanged", value }),
    setNewJobData: (value) => dispatch({ type: "newJobDataChanged", value }),
    addJob,
    drainQueue,
    retryJobs,
    setQueuePaused,
    setQueueConcurrency,
    rateLimitQueue,
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
