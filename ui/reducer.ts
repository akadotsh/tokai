import type {
  JobCounts,
  QueueJobsPage,
  QueueJobSummary,
  QueueRef,
} from "../server/index";

export type AppState = {
  redisUrl: string;
  queues: JobCounts[];
  selectedQueue: QueueRef | null;
  jobs: QueueJobSummary[];
  jobsPage: number;
  jobsTotal: number;
  hasNextJobsPage: boolean;
  jobsMessage: string;
  isLoadingJobs: boolean;
  deletingJobId: string | null;
  isAddJobScreenOpen: boolean;
  newJobName: string;
  newJobData: string;
  isAddingJob: boolean;
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
  | { type: "queuesRefreshed"; queues: JobCounts[] }
  | { type: "queuesFailed"; message: string }
  | { type: "jobsLoading"; queue: QueueRef; page: number }
  | { type: "jobsLoaded"; queue: QueueRef; result: QueueJobsPage }
  | { type: "jobsRefreshed"; queue: QueueRef; result: QueueJobsPage }
  | { type: "jobsFailed"; queue: QueueRef; page: number; message: string }
  | { type: "selectedQueueMissing"; queue: QueueRef }
  | { type: "showQueues" }
  | { type: "jobDeleteStarted"; jobId: string }
  | { type: "jobDeleted"; jobId: string }
  | { type: "jobDeleteFailed"; jobId: string; message: string }
  | { type: "addJobScreenOpened" }
  | { type: "addJobScreenClosed" }
  | { type: "newJobNameChanged"; value: string }
  | { type: "newJobDataChanged"; value: string }
  | { type: "jobAddStarted" }
  | { type: "jobAdded"; job: QueueJobSummary }
  | { type: "jobAddFailed"; message: string }
  | { type: "queueObliterateStarted" }
  | { type: "queueObliterated"; queue: QueueRef }
  | { type: "queueObliterateFailed"; message: string };

export function createInitialState(isConnected: boolean): AppState {
  return {
    redisUrl: "",
    queues: [],
    selectedQueue: null,
    jobs: [],
    jobsPage: 1,
    jobsTotal: 0,
    hasNextJobsPage: false,
    jobsMessage: "",
    isLoadingJobs: false,
    deletingJobId: null,
    isAddJobScreenOpen: false,
    newJobName: "",
    newJobData: "{}",
    isAddingJob: false,
    isObliteratingQueue: false,
    message: "",
    isConnected,
  };
}

function isSameQueue(left: QueueRef | null, right: QueueRef) {
  return left?.name === right.name && left.prefix === right.prefix;
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
      return { ...state, message: "Scanning for queues..." };
    case "queuesLoaded":
      return {
        ...state,
        queues: action.queues,
        message:
          action.queues.length === 0
            ? "No queues found."
            : `Found ${action.queues.length} Queue${action.queues.length === 1 ? "" : "s"}.`,
      };
    case "queuesRefreshed":
      return { ...state, queues: action.queues };
    case "queuesFailed":
      return { ...state, message: action.message };
    case "jobsLoading":
      return {
        ...state,
        selectedQueue: action.queue,
        jobs: [],
        jobsPage: action.page,
        jobsTotal: isSameQueue(state.selectedQueue, action.queue)
          ? state.jobsTotal
          : 0,
        hasNextJobsPage: false,
        jobsMessage: "",
        isLoadingJobs: true,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        isAddingJob: false,
      };
    case "jobsLoaded":
      if (
        !isSameQueue(state.selectedQueue, action.queue) ||
        state.jobsPage !== action.result.page
      ) {
        return state;
      }
      return {
        ...state,
        jobs: action.result.jobs,
        jobsTotal: action.result.total,
        hasNextJobsPage: action.result.hasNextPage,
        isLoadingJobs: false,
      };
    case "jobsRefreshed":
      if (
        !isSameQueue(state.selectedQueue, action.queue) ||
        state.jobsPage !== action.result.page
      ) {
        return state;
      }
      return {
        ...state,
        jobs: action.result.jobs,
        jobsTotal: action.result.total,
        hasNextJobsPage: action.result.hasNextPage,
      };
    case "jobsFailed":
      if (
        !isSameQueue(state.selectedQueue, action.queue) ||
        state.jobsPage !== action.page
      ) {
        return state;
      }
      return {
        ...state,
        jobsMessage: action.message,
        isLoadingJobs: false,
      };
    case "selectedQueueMissing":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        selectedQueue: null,
        jobs: [],
        jobsPage: 1,
        jobsTotal: 0,
        hasNextJobsPage: false,
        jobsMessage: "",
        isLoadingJobs: false,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        message: `Queue "${action.queue.name}" is no longer available.`,
      };
    case "showQueues":
      return {
        ...state,
        selectedQueue: null,
        jobs: [],
        jobsPage: 1,
        jobsTotal: 0,
        hasNextJobsPage: false,
        jobsMessage: "",
        isLoadingJobs: false,
        deletingJobId: null,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        isAddingJob: false,
        isObliteratingQueue: false,
      };
    case "jobDeleteStarted":
      return { ...state, deletingJobId: action.jobId, jobsMessage: "" };
    case "jobDeleted":
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.jobId),
        jobsTotal: Math.max(0, state.jobsTotal - 1),
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
    case "addJobScreenOpened":
      return {
        ...state,
        isAddJobScreenOpen: true,
        newJobName: "",
        newJobData: "{}",
        jobsMessage: "",
      };
    case "addJobScreenClosed":
      if (state.isAddingJob) return state;
      return {
        ...state,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        jobsMessage: "",
      };
    case "newJobNameChanged":
      return { ...state, newJobName: action.value, jobsMessage: "" };
    case "newJobDataChanged":
      return { ...state, newJobData: action.value, jobsMessage: "" };
    case "jobAddStarted":
      return { ...state, isAddingJob: true, jobsMessage: "" };
    case "jobAdded":
      return {
        ...state,
        jobsTotal: state.jobsTotal + 1,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        isAddingJob: false,
        jobsMessage: `Added job "${action.job.name}".`,
      };
    case "jobAddFailed":
      return { ...state, isAddingJob: false, jobsMessage: action.message };
    case "queueObliterateStarted":
      return { ...state, isObliteratingQueue: true, jobsMessage: "" };
    case "queueObliterated":
      return {
        ...state,
        queues: state.queues.filter(
          (queue) => !isSameQueue(queue, action.queue),
        ),
        selectedQueue: null,
        jobs: [],
        jobsPage: 1,
        jobsTotal: 0,
        hasNextJobsPage: false,
        isObliteratingQueue: false,
        message: `Obliterated queue "${action.queue.name}".`,
      };
    case "queueObliterateFailed":
      return {
        ...state,
        isObliteratingQueue: false,
        jobsMessage: action.message,
      };
  }
}
