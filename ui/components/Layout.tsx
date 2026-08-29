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
  onDisconnect: () => void;
  onRefresh: () => void;
  onQueueSelect: (queueName: string) => void;
  onBackToQueues: () => void;
  onDeleteJob: (jobId: string) => void;
};

export function Layout({
  queues,
  message,
  selectedQueue,
  jobs,
  jobsMessage,
  isLoadingJobs,
  deletingJobId,
  onDisconnect,
  onRefresh,
  onQueueSelect,
  onBackToQueues,
  onDeleteJob,
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
          onBack={onBackToQueues}
          onDelete={onDeleteJob}
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
