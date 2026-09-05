import type {
  JobCounts,
  QueueJobDetails,
  QueueJobStatus,
  QueueJobsPage,
  QueueJobSummary,
  QueueRef,
  RetryableJobState,
  CleanableJobStatus,
} from "../server/index";

export type AppState = {
  redisUrl: string;
  pollingIntervalMs: number;
  queues: JobCounts[];
  selectedQueue: QueueRef | null;
  jobs: QueueJobSummary[];
  jobsPage: number;
  jobsTotal: number;
  hasNextJobsPage: boolean;
  jobsStatusFilter: QueueJobStatus | null;
  jobsSearchQuery: string;
  jobsMessage: string;
  isLoadingJobs: boolean;
  deletingJobId: string | null;
  retryingJobId: string | null;
  selectedJobId: string | null;
  selectedJobDetails: QueueJobDetails | null;
  isLoadingJobDetails: boolean;
  jobDetailsMessage: string;
  isAddJobScreenOpen: boolean;
  newJobName: string;
  newJobData: string;
  isAddingJob: boolean;
  isDrainingQueue: boolean;
  isCleaningJobs: boolean;
  isRetryingJobs: boolean;
  changingQueueStatus: QueueRef | null;
  isSettingQueueConcurrency: boolean;
  isRateLimitingQueue: boolean;
  isObliteratingQueue: boolean;
  message: string;
  isConnected: boolean;
};

export type AppAction =
  | { type: "redisUrlChanged"; value: string }
  | { type: "pollingIntervalChanged"; value: number }
  | { type: "messageSet"; message: string }
  | { type: "connected"; redisUrl: string }
  | { type: "disconnected" }
  | { type: "queuesLoading" }
  | { type: "queuesLoaded"; queues: JobCounts[] }
  | { type: "queuesRefreshed"; queues: JobCounts[] }
  | { type: "queuesFailed"; message: string }
  | {
      type: "jobsLoading";
      queue: QueueRef;
      page: number;
      status: QueueJobStatus | null;
      searchQuery: string;
    }
  | { type: "jobsLoaded"; queue: QueueRef; result: QueueJobsPage }
  | { type: "jobsRefreshed"; queue: QueueRef; result: QueueJobsPage }
  | {
      type: "jobsFailed";
      queue: QueueRef;
      page: number;
      status: QueueJobStatus | null;
      searchQuery: string;
      message: string;
    }
  | { type: "selectedQueueMissing"; queue: QueueRef }
  | { type: "showQueues" }
  | { type: "jobDeleteStarted"; jobId: string }
  | { type: "jobDeleted"; jobId: string }
  | { type: "jobDeleteFailed"; jobId: string; message: string }
  | { type: "jobRetryStarted"; jobId: string }
  | {
      type: "jobRetried";
      queue: QueueRef;
      jobId: string;
      result: QueueJobsPage;
    }
  | { type: "jobRetryFailed"; jobId: string; message: string }
  | { type: "jobDetailsLoading"; jobId: string }
  | { type: "jobDetailsLoaded"; jobId: string; details: QueueJobDetails }
  | { type: "jobDetailsFailed"; jobId: string; message: string }
  | { type: "jobDetailsClosed" }
  | { type: "addJobScreenOpened" }
  | { type: "addJobScreenClosed" }
  | { type: "newJobNameChanged"; value: string }
  | { type: "newJobDataChanged"; value: string }
  | { type: "jobAddStarted" }
  | { type: "jobAdded"; job: QueueJobSummary }
  | { type: "jobAddFailed"; message: string }
  | { type: "queueDrainStarted" }
  | { type: "queueDrained"; queue: QueueRef; result: QueueJobsPage }
  | { type: "queueDrainFailed"; message: string }
  | { type: "queueCleanStarted" }
  | {
      type: "queueCleaned";
      queue: QueueRef;
      status: CleanableJobStatus;
      removedCount: number;
      result: QueueJobsPage;
      queueInfo: JobCounts;
    }
  | { type: "queueCleanFailed"; message: string }
  | { type: "jobsRetryStarted" }
  | {
      type: "jobsRetried";
      queue: QueueRef;
      state: RetryableJobState;
      result: QueueJobsPage;
    }
  | { type: "jobsRetryFailed"; message: string }
  | { type: "queueStatusChangeStarted"; queue: QueueRef }
  | {
      type: "queueStatusChanged";
      queue: QueueRef;
      paused: boolean;
      queueInfo: JobCounts;
    }
  | { type: "queueStatusChangeFailed"; queue: QueueRef; message: string }
  | { type: "queueConcurrencySetStarted" }
  | {
      type: "queueConcurrencySet";
      queue: QueueRef;
      concurrency: number;
      queueInfo: JobCounts;
    }
  | { type: "queueConcurrencySetFailed"; message: string }
  | { type: "queueRateLimitStarted" }
  | { type: "queueRateLimited"; queue: QueueRef; durationMs: number }
  | { type: "queueRateLimitFailed"; message: string }
  | { type: "queueObliterateStarted" }
  | { type: "queueObliterated"; queue: QueueRef }
  | { type: "queueObliterateFailed"; message: string };

export function createInitialState(isConnected: boolean): AppState {
  return {
    redisUrl: "",
    pollingIntervalMs: 5_000,
    queues: [],
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
    message: "",
    isConnected,
  };
}
