import type { JobCounts, QueueJobSummary } from "../../server/index";
import { AddJob } from "./AddJob";
import { Header } from "./Header";
import { Jobs } from "./Jobs";
import { Queues } from "./Queues";

type LayoutProps = {
  queues: JobCounts[];
  message: string;
  selectedQueue: string | null;
  jobs: QueueJobSummary[];
  jobsMessage: string;
  isLoadingJobs: boolean;
  deletingJobId: string | null;
  isAddJobScreenOpen: boolean;
  newJobName: string;
  newJobData: string;
  isAddingJob: boolean;
  isObliteratingQueue: boolean;
  onDisconnect: () => void;
  onRefresh: () => void;
  onQueueSelect: (queueName: string) => void;
  onBackToQueues: () => void;
  onDeleteJob: (jobId: string) => void;
  onOpenAddJob: () => void;
  onCloseAddJob: () => void;
  onNewJobNameChange: (value: string) => void;
  onNewJobDataChange: (value: string) => void;
  onAddJob: () => void;
  onObliterateQueue: () => void;
};

export function Layout({
  queues,
  message,
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
  onDisconnect,
  onRefresh,
  onQueueSelect,
  onBackToQueues,
  onDeleteJob,
  onOpenAddJob,
  onCloseAddJob,
  onNewJobNameChange,
  onNewJobDataChange,
  onAddJob,
  onObliterateQueue,
}: LayoutProps) {
  return (
    <box
      width="100%"
      height="100%"
      backgroundColor="#000000"
      flexDirection="column"
    >
      <Header onDisconnect={onDisconnect} />
      {selectedQueue && isAddJobScreenOpen ? (
        <AddJob
          queueName={selectedQueue}
          name={newJobName}
          data={newJobData}
          message={jobsMessage}
          isAdding={isAddingJob}
          onNameChange={onNewJobNameChange}
          onDataChange={onNewJobDataChange}
          onSubmit={onAddJob}
          onBack={onCloseAddJob}
        />
      ) : selectedQueue ? (
        <Jobs
          queueName={selectedQueue}
          jobs={jobs}
          isLoading={isLoadingJobs}
          message={jobsMessage}
          deletingJobId={deletingJobId}
          isObliterating={isObliteratingQueue}
          onBack={onBackToQueues}
          onDelete={onDeleteJob}
          onOpenAddJob={onOpenAddJob}
          onObliterate={onObliterateQueue}
        />
      ) : (
        <Queues
          queues={queues}
          message={message}
          onRefresh={onRefresh}
          onQueueSelect={onQueueSelect}
        />
      )}
    </box>
  );
}
