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
  onDisconnect: () => void;
  onRefresh: () => void;
  onQueueSelect: (queueName: string) => void;
  onBackToQueues: () => void;
};

export function Layout({
  queues,
  message,
  selectedQueue,
  jobs,
  jobsMessage,
  isLoadingJobs,
  onDisconnect,
  onRefresh,
  onQueueSelect,
  onBackToQueues,
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
          onBack={onBackToQueues}
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
