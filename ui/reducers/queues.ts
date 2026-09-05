import type { AppAction, AppState } from "../state";
import { isSameQueue } from "./helpers";

export function reduceQueueState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
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
    case "selectedQueueMissing":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        selectedQueue: null,
        jobs: [],
        jobsPage: 1,
        jobsTotal: 0,
        hasNextJobsPage: false,
        jobsStatusFilter: null,
        jobsSearchQuery: "",
        jobsMessage: "",
        isLoadingJobs: false,
        retryingJobId: null,
        selectedJobId: null,
        selectedJobDetails: null,
        isLoadingJobDetails: false,
        jobDetailsMessage: "",
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        isCleaningJobs: false,
        isRetryingJobs: false,
        changingQueueStatus: null,
        isSettingQueueConcurrency: false,
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
        jobsStatusFilter: null,
        jobsSearchQuery: "",
        jobsMessage: "",
        isLoadingJobs: false,
        deletingJobId: null,
        retryingJobId: null,
        selectedJobId: null,
        selectedJobDetails: null,
        isLoadingJobDetails: false,
        jobDetailsMessage: "",
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        isAddingJob: false,
        isDrainingQueue: false,
        isCleaningJobs: false,
        isRetryingJobs: false,
        changingQueueStatus: null,
        isSettingQueueConcurrency: false,
        isRateLimitingQueue: false,
        isObliteratingQueue: false,
      };
    case "queueDrainStarted":
      return { ...state, isDrainingQueue: true, jobsMessage: "" };
    case "queueDrained":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        jobs: action.result.jobs,
        jobsPage: action.result.page,
        jobsTotal: action.result.total,
        hasNextJobsPage: action.result.hasNextPage,
        isDrainingQueue: false,
        jobsMessage: `Emptied queue "${action.queue.name}".`,
      };
    case "queueDrainFailed":
      return {
        ...state,
        isDrainingQueue: false,
        jobsMessage: action.message,
      };
    case "queueCleanStarted":
      return { ...state, isCleaningJobs: true, jobsMessage: "" };
    case "queueCleaned":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        queues: state.queues.map((queue) =>
          isSameQueue(queue, action.queue) ? action.queueInfo : queue,
        ),
        jobs: action.result.jobs,
        jobsPage: action.result.page,
        jobsTotal: action.result.total,
        hasNextJobsPage: action.result.hasNextPage,
        isCleaningJobs: false,
        jobsMessage: `Cleaned ${action.removedCount} ${action.status} job${action.removedCount === 1 ? "" : "s"} from queue "${action.queue.name}".`,
      };
    case "queueCleanFailed":
      return {
        ...state,
        isCleaningJobs: false,
        jobsMessage: action.message,
      };
    case "jobsRetryStarted":
      return { ...state, isRetryingJobs: true, jobsMessage: "" };
    case "jobsRetried":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        jobs: action.result.jobs,
        jobsPage: action.result.page,
        jobsTotal: action.result.total,
        hasNextJobsPage: action.result.hasNextPage,
        isRetryingJobs: false,
        jobsMessage: `Retried ${action.state} jobs in queue "${action.queue.name}".`,
      };
    case "jobsRetryFailed":
      return {
        ...state,
        isRetryingJobs: false,
        jobsMessage: action.message,
      };
    case "queueStatusChangeStarted":
      return {
        ...state,
        changingQueueStatus: action.queue,
        jobsMessage: "",
        message: "",
      };
    case "queueStatusChanged":
      if (!isSameQueue(state.changingQueueStatus, action.queue)) return state;
      return {
        ...state,
        queues: state.queues.map((queue) =>
          isSameQueue(queue, action.queue) ? action.queueInfo : queue,
        ),
        changingQueueStatus: null,
        jobsMessage: `${action.paused ? "Paused" : "Resumed"} queue "${action.queue.name}".`,
        message: `${action.paused ? "Paused" : "Resumed"} queue "${action.queue.name}".`,
      };
    case "queueStatusChangeFailed":
      if (!isSameQueue(state.changingQueueStatus, action.queue)) return state;
      return {
        ...state,
        changingQueueStatus: null,
        jobsMessage: action.message,
        message: action.message,
      };
    case "queueConcurrencySetStarted":
      return { ...state, isSettingQueueConcurrency: true, jobsMessage: "" };
    case "queueConcurrencySet":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        queues: state.queues.map((queue) =>
          isSameQueue(queue, action.queue) ? action.queueInfo : queue,
        ),
        isSettingQueueConcurrency: false,
        jobsMessage: `Set concurrency for queue "${action.queue.name}" to ${action.concurrency}.`,
      };
    case "queueConcurrencySetFailed":
      return {
        ...state,
        isSettingQueueConcurrency: false,
        jobsMessage: action.message,
      };
    case "queueRateLimitStarted":
      return { ...state, isRateLimitingQueue: true, jobsMessage: "" };
    case "queueRateLimited":
      if (!isSameQueue(state.selectedQueue, action.queue)) return state;
      return {
        ...state,
        isRateLimitingQueue: false,
        jobsMessage: `Rate limited queue "${action.queue.name}" for ${action.durationMs} ms.`,
      };
    case "queueRateLimitFailed":
      return {
        ...state,
        isRateLimitingQueue: false,
        jobsMessage: action.message,
      };
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
        jobsStatusFilter: null,
        jobsSearchQuery: "",
        selectedJobId: null,
        selectedJobDetails: null,
        isLoadingJobDetails: false,
        jobDetailsMessage: "",
        retryingJobId: null,
        isCleaningJobs: false,
        isRetryingJobs: false,
        changingQueueStatus: null,
        isSettingQueueConcurrency: false,
        isObliteratingQueue: false,
        message: `Obliterated queue "${action.queue.name}".`,
      };
    case "queueObliterateFailed":
      return {
        ...state,
        isObliteratingQueue: false,
        jobsMessage: action.message,
      };
    default:
      return state;
  }
}
