import type { JobCounts, QueueJobSummary } from "../../server/index";
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
  isObliteratingQueue: boolean;
  onDisconnect: () => void;
  onRefresh: () => void;
  onQueueSelect: (queueName: string) => void;
  onBackToQueues: () => void;
  onDeleteJob: (jobId: string) => void;
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
  isObliteratingQueue,
  onDisconnect,
  onRefresh,
  onQueueSelect,
  onBackToQueues,
  onDeleteJob,
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
      {selectedQueue ? (
        <Jobs
          queueName={selectedQueue}
          jobs={jobs}
          isLoading={isLoadingJobs}
          message={jobsMessage}
          deletingJobId={deletingJobId}
          isObliterating={isObliteratingQueue}
          onBack={onBackToQueues}
          onDelete={onDeleteJob}
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
