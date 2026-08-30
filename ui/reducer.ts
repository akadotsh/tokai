import type { JobCounts, QueueJobSummary } from "../server/index";

export type AppState = {
  redisUrl: string;
  queues: JobCounts[];
  selectedQueue: string | null;
  jobs: QueueJobSummary[];
  jobsMessage: string;
  isLoadingJobs: boolean;
  deletingJobId: string | null;
  isObliteratingQueue: boolean;
  message: string;
  isConnected: boolean;
};

export type AppAction =
  | { type: "redisUrlChanged"; value: string }
  | { type: "messageSet"; message: string }
  | { type: "connected"; redisUrl: string }
  | { type: "disconnected" }
  | { type: "queuesLoading" }
  | { type: "queuesLoaded"; queues: JobCounts[] }
  | { type: "queuesFailed"; message: string }
  | { type: "jobsLoading"; queueName: string }
  | { type: "jobsLoaded"; queueName: string; jobs: QueueJobSummary[] }
  | { type: "jobsFailed"; queueName: string; message: string }
  | { type: "showQueues" }
  | { type: "jobDeleteStarted"; jobId: string }
  | { type: "jobDeleted"; jobId: string }
  | { type: "jobDeleteFailed"; jobId: string; message: string }
  | { type: "queueObliterateStarted" }
  | { type: "queueObliterated"; queueName: string }
  | { type: "queueObliterateFailed"; message: string };

export function createInitialState(isConnected: boolean): AppState {
  return {
    redisUrl: "",
    queues: [],
    selectedQueue: null,
    jobs: [],
    jobsMessage: "",
    isLoadingJobs: false,
    deletingJobId: null,
    isObliteratingQueue: false,
    message: "",
    isConnected,
  };
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "redisUrlChanged":
      return { ...state, redisUrl: action.value, message: "" };
    case "messageSet":
      return { ...state, message: action.message };
    case "connected":
      return { ...state, redisUrl: action.redisUrl, isConnected: true };
    case "disconnected":
      return createInitialState(false);
    case "queuesLoading":
      return { ...state, message: "Scanning for BullMQ queues..." };
    case "queuesLoaded":
      return {
        ...state,
        queues: action.queues,
        message:
          action.queues.length === 0
            ? "No BullMQ queues found."
            : `Found ${action.queues.length} BullMQ queue${action.queues.length === 1 ? "" : "s"}.`,
      };
    case "queuesFailed":
      return { ...state, message: action.message };
    case "jobsLoading":
      return {
        ...state,
        selectedQueue: action.queueName,
        jobs: [],
        jobsMessage: "",
        isLoadingJobs: true,
      };
    case "jobsLoaded":
      if (state.selectedQueue !== action.queueName) return state;
      return { ...state, jobs: action.jobs, isLoadingJobs: false };
    case "jobsFailed":
      if (state.selectedQueue !== action.queueName) return state;
      return {
        ...state,
        jobsMessage: action.message,
        isLoadingJobs: false,
      };
    case "showQueues":
      return {
        ...state,
        selectedQueue: null,
        jobs: [],
        jobsMessage: "",
        isLoadingJobs: false,
        deletingJobId: null,
        isObliteratingQueue: false,
      };
    case "jobDeleteStarted":
      return { ...state, deletingJobId: action.jobId, jobsMessage: "" };
    case "jobDeleted":
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.jobId),
        deletingJobId: null,
        jobsMessage: `Deleted job "${action.jobId}".`,
      };
    case "jobDeleteFailed":
      if (state.deletingJobId !== action.jobId) return state;
      return {
        ...state,
        deletingJobId: null,
        jobsMessage: action.message,
      };
    case "queueObliterateStarted":
      return { ...state, isObliteratingQueue: true, jobsMessage: "" };
    case "queueObliterated":
      return {
        ...state,
        queues: state.queues.filter((queue) => queue.name !== action.queueName),
        selectedQueue: null,
        jobs: [],
        isObliteratingQueue: false,
        message: `Obliterated queue "${action.queueName}".`,
      };
    case "queueObliterateFailed":
      return {
        ...state,
        isObliteratingQueue: false,
        jobsMessage: action.message,
      };
  }
}
