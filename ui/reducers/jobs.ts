import type { AppAction, AppState } from "../state";
import { isSameQueue, jobMatchesSearch } from "./helpers";

export function reduceJobState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "jobsLoading":
      return {
        ...state,
        selectedQueue: action.queue,
        jobs: isSameQueue(state.selectedQueue, action.queue) ? state.jobs : [],
        jobsPage: action.page,
        jobsTotal: isSameQueue(state.selectedQueue, action.queue)
          ? state.jobsTotal
          : 0,
        hasNextJobsPage: false,
        jobsStatusFilter: action.status,
        jobsSearchQuery: action.searchQuery,
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
        state.jobsPage !== action.result.page ||
        state.jobsStatusFilter !== action.result.status ||
        state.jobsSearchQuery !== action.result.searchQuery
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
        state.jobsPage !== action.result.page ||
        state.jobsStatusFilter !== action.result.status ||
        state.jobsSearchQuery !== action.result.searchQuery
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
        state.jobsPage !== action.page ||
        state.jobsStatusFilter !== action.status ||
        state.jobsSearchQuery !== action.searchQuery
      ) {
        return state;
      }
      return {
        ...state,
        jobs: [],
        jobsTotal: 0,
        hasNextJobsPage: false,
        jobsMessage: action.message,
        isLoadingJobs: false,
      };
    case "jobDeleteStarted":
      return { ...state, deletingJobId: action.jobId, jobsMessage: "" };
    case "jobDeleted":
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.jobId),
        jobsTotal: Math.max(0, state.jobsTotal - 1),
        deletingJobId: null,
        selectedJobId: null,
        selectedJobDetails: null,
        isLoadingJobDetails: false,
        jobDetailsMessage: "",
        jobsMessage: `Deleted job "${action.jobId}".`,
      };
    case "jobDeleteFailed":
      if (state.deletingJobId !== action.jobId) return state;
      return {
        ...state,
        deletingJobId: null,
        jobsMessage: action.message,
      };
    case "jobRetryStarted":
      return { ...state, retryingJobId: action.jobId, jobsMessage: "" };
    case "jobRetried":
      if (
        !isSameQueue(state.selectedQueue, action.queue) ||
        state.retryingJobId !== action.jobId
      ) {
        return state;
      }
      return {
        ...state,
        jobs: action.result.jobs,
        jobsPage: action.result.page,
        jobsTotal: action.result.total,
        hasNextJobsPage: action.result.hasNextPage,
        retryingJobId: null,
        jobsMessage: `Retried job "${action.jobId}".`,
      };
    case "jobRetryFailed":
      if (state.retryingJobId !== action.jobId) return state;
      return {
        ...state,
        retryingJobId: null,
        jobsMessage: action.message,
      };
    case "jobDetailsLoading":
      return {
        ...state,
        selectedJobId: action.jobId,
        selectedJobDetails: null,
        isLoadingJobDetails: true,
        jobDetailsMessage: "",
      };
    case "jobDetailsLoaded":
      if (state.selectedJobId !== action.jobId) return state;
      return {
        ...state,
        selectedJobDetails: action.details,
        isLoadingJobDetails: false,
      };
    case "jobDetailsFailed":
      if (state.selectedJobId !== action.jobId) return state;
      return {
        ...state,
        isLoadingJobDetails: false,
        jobDetailsMessage: action.message,
      };
    case "jobDetailsClosed":
      return {
        ...state,
        selectedJobId: null,
        selectedJobDetails: null,
        isLoadingJobDetails: false,
        jobDetailsMessage: "",
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
        jobsTotal:
          (state.jobsStatusFilter === null ||
            state.jobsStatusFilter === action.job.status) &&
          jobMatchesSearch(action.job, state.jobsSearchQuery)
            ? state.jobsTotal + 1
            : state.jobsTotal,
        isAddJobScreenOpen: false,
        newJobName: "",
        newJobData: "{}",
        isAddingJob: false,
        jobsMessage: `Added job "${action.job.name}".`,
      };
    case "jobAddFailed":
      return { ...state, isAddingJob: false, jobsMessage: action.message };
    default:
      return state;
  }
}
