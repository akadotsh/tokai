import { SyntaxStyle } from "@opentui/core";
import { useEffect, useState } from "react";
import {
  queueJobStatuses,
  type QueueJobStatus,
} from "../../server/index";
import { useTokai } from "../provider";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { ConcurrencyDialog } from "./ConcurrencyDialog";
import { JobDetailsModal } from "./JobDetailsModal";
import { RateLimitDialog } from "./RateLimitDialog";

const statusColors: Record<QueueJobStatus, string> = {
  completed: "#4ADE80",
  failed: "#FB7185",
  delayed: "#FACC15",
  active: "#60A5FA",
  wait: "#C7D2E9",
  "waiting-children": "#A78BFA",
  prioritized: "#F472B6",
  repeat: "#2DD4BF",
};

const statusFilterOptions: Array<{
  label: string;
  value: QueueJobStatus | null;
}> = [
  { label: "all", value: null },
  ...queueJobStatuses.map((status) => ({
    label: status.replaceAll("-", " "),
    value: status,
  })),
];

const jsonSyntaxStyle = SyntaxStyle.fromStyles({
  default: { fg: "#C7D2E9" },
  property: { fg: "#60A5FA" },
  string: { fg: "#4ADE80" },
  number: { fg: "#FACC15" },
  boolean: { fg: "#A78BFA" },
  null: { fg: "#94A3B8" },
  punctuation: { fg: "#8290AA" },
});

function formatJobData(data: unknown) {
  return JSON.stringify(data, null, 2) ?? "null";
}

export function Jobs() {
  const [jobSearchInput, setJobSearchInput] = useState("");
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isQueueOptionsOpen, setIsQueueOptionsOpen] = useState(false);
  const [isQueueInfoOpen, setIsQueueInfoOpen] = useState(false);
  const [isPollingIntervalEditing, setIsPollingIntervalEditing] =
    useState(false);
  const [pollingIntervalInput, setPollingIntervalInput] = useState("");
  const [pollingIntervalError, setPollingIntervalError] = useState("");
  const [isConcurrencyDialogOpen, setIsConcurrencyDialogOpen] = useState(false);
  const [concurrencyInput, setConcurrencyInput] = useState("");
  const [concurrencyError, setConcurrencyError] = useState("");
  const [isRateLimitDialogOpen, setIsRateLimitDialogOpen] = useState(false);
  const [rateLimitDuration, setRateLimitDuration] = useState("");
  const [rateLimitError, setRateLimitError] = useState("");
  const [isDrainConfirmationOpen, setIsDrainConfirmationOpen] = useState(false);
  const [isRetryConfirmationOpen, setIsRetryConfirmationOpen] = useState(false);
  const [isObliterateConfirmationOpen, setIsObliterateConfirmationOpen] =
    useState(false);
  const {
    state: {
      queues,
      selectedQueue,
      jobs,
      jobsPage,
      jobsTotal,
      hasNextJobsPage,
      jobsStatusFilter,
      jobsSearchQuery,
      pollingIntervalMs,
      isLoadingJobs,
      jobsMessage,
      deletingJobId,
      retryingJobId,
      isDrainingQueue,
      isRetryingJobs,
      changingQueueStatus,
      isSettingQueueConcurrency,
      isRateLimitingQueue,
      isObliteratingQueue,
    },
    actions: {
      showQueues,
      setPollingInterval,
      deleteJob,
      retryJob,
      openAddJob,
      drainQueue,
      retryJobs,
      setQueuePaused,
      setQueueConcurrency,
      rateLimitQueue,
      obliterateQueue,
      showPreviousJobsPage,
      showNextJobsPage,
      filterJobsByStatus,
      searchJobs,
      openJobDetails,
    },
  } = useTokai();

  useEffect(() => {
    const query = jobSearchInput.trim();

    if (query === jobsSearchQuery || isLoadingJobs) return;

    const timeout = setTimeout(() => void searchJobs(query), 300);
    return () => clearTimeout(timeout);
  }, [isLoadingJobs, jobSearchInput, jobsSearchQuery]);

  if (!selectedQueue) return null;

  const canShowPreviousPage = jobsPage > 1 && !isLoadingJobs;
  const canShowNextPage = hasNextJobsPage && !isLoadingJobs;
  const selectedQueueInfo = queues.find(
    (queue) =>
      queue.name === selectedQueue.name && queue.prefix === selectedQueue.prefix,
  );
  const isQueuePaused = selectedQueueInfo?.meta.paused ?? false;

  const closeQueueInfo = () => {
    setIsQueueInfoOpen(false);
    setIsPollingIntervalEditing(false);
    setPollingIntervalError("");
  };

  const editPollingInterval = () => {
    setPollingIntervalInput(String(pollingIntervalMs));
    setPollingIntervalError("");
    setIsPollingIntervalEditing(true);
  };

  const confirmPollingInterval = () => {
    const intervalMs = Number(pollingIntervalInput);

    if (!Number.isInteger(intervalMs) || intervalMs <= 0) {
      setPollingIntervalError("Enter a positive whole number of milliseconds.");
      return;
    }

    setPollingInterval(intervalMs);
    setIsPollingIntervalEditing(false);
    setPollingIntervalError("");
  };

  const confirmRateLimitQueue = async () => {
    if (isRateLimitingQueue) return;

    const durationMs = Number(rateLimitDuration);

    if (!Number.isInteger(durationMs) || durationMs <= 0) {
      setRateLimitError("Enter a positive whole number of milliseconds.");
      return;
    }

    setRateLimitError("");
    await rateLimitQueue(durationMs);
    setIsRateLimitDialogOpen(false);
  };

  const confirmQueueConcurrency = async () => {
    if (isSettingQueueConcurrency) return;

    const concurrency = Number(concurrencyInput);

    if (!Number.isInteger(concurrency) || concurrency <= 0) {
      setConcurrencyError("Enter a positive whole number.");
      return;
    }

    setConcurrencyError("");
    await setQueueConcurrency(concurrency);
    setIsConcurrencyDialogOpen(false);
  };

  const confirmDrainQueue = async () => {
    if (isDrainingQueue) return;

    await drainQueue();
    setIsDrainConfirmationOpen(false);
  };

  const confirmRetryFailedJobs = async () => {
    if (isRetryingJobs) return;

    await retryJobs("failed");
    setIsRetryConfirmationOpen(false);
  };

  const confirmObliterateQueue = async () => {
    if (isObliteratingQueue) return;

    await obliterateQueue();
    setIsObliterateConfirmationOpen(false);
  };

  return (
    <box
      width="100%"
      height="100%"
      minHeight={0}
      flexGrow={1}
      flexShrink={1}
      overflow="hidden"
      position="relative"
      padding={2}
      flexDirection="column"
      gap={1}
    >
      <box
        width="100%"
        height={3}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        zIndex={1_000}
      >
        <box flexDirection="row" alignItems="center" gap={2}>
          <box
            width={10}
            height={3}
            backgroundColor="#253552"
            alignItems="center"
            justifyContent="center"
            onMouseDown={showQueues}
          >
            <text fg="#FFFFFF">← Back</text>
          </box>
          <box
            position="relative"
            flexDirection="row"
            alignItems="center"
            gap={1}
          >
            <text fg="#F3F6FF">
              {selectedQueue.name} · {jobsTotal}{" "}
              {jobsSearchQuery ? "matches" : "jobs"}
            </text>
            <box
              width={3}
              height={1}
              alignItems="center"
              justifyContent="center"
              onMouseDown={() => {
                setIsStatusFilterOpen(false);
                setIsQueueOptionsOpen(false);
                if (isQueueInfoOpen) {
                  closeQueueInfo();
                } else {
                  setIsQueueInfoOpen(true);
                }
              }}
            >
              <text fg="#60A5FA">ⓘ</text>
            </box>

            {isQueueInfoOpen ? (
              <box
                position="absolute"
                top={2}
                left={0}
                zIndex={2_000}
                width={52}
                height={
                  isPollingIntervalEditing
                    ? pollingIntervalError
                      ? 19
                      : 17
                    : 15
                }
                border
                borderColor="#3B82F6"
                backgroundColor="#000000"
                paddingLeft={1}
                paddingRight={1}
                flexDirection="column"
                gap={1}
              >
                <text fg="#C7D2E9">Prefix: {selectedQueue.prefix}</text>
                <text fg="#C7D2E9">
                  Status:{" "}
                  {selectedQueueInfo
                    ? selectedQueueInfo.meta.paused
                      ? "paused"
                      : "running"
                    : "unknown"}
                </text>
                <text fg="#C7D2E9">
                  Version: {selectedQueueInfo?.meta.version ?? "unknown"}
                </text>
                <text fg="#C7D2E9">
                  Concurrency: {selectedQueueInfo?.meta.concurrency ?? "not set"}
                </text>
                <text fg="#C7D2E9">
                  Rate limit:{" "}
                  {selectedQueueInfo?.meta.max !== undefined &&
                  selectedQueueInfo.meta.duration !== undefined
                    ? `${selectedQueueInfo.meta.max} jobs / ${selectedQueueInfo.meta.duration} ms`
                    : "not set"}
                </text>
                <text fg="#C7D2E9">
                  Event stream max:{" "}
                  {selectedQueueInfo?.meta.maxLenEvents ?? "not set"}
                </text>
                {isPollingIntervalEditing ? (
                  <>
                    <box
                      width="100%"
                      height={3}
                      flexDirection="row"
                      alignItems="center"
                      gap={1}
                    >
                      <text fg="#C7D2E9">Polling:</text>
                      <box height={3} minWidth={0} flexGrow={1} border>
                        <input
                          value={pollingIntervalInput}
                          placeholder="5000"
                          placeholderColor="#59677F"
                          textColor="#F3F6FF"
                          focused
                          onInput={(value) => {
                            setPollingIntervalInput(value);
                            setPollingIntervalError("");
                          }}
                          onSubmit={confirmPollingInterval}
                        />
                      </box>
                      <text fg="#8290AA">ms</text>
                      <box
                        width={3}
                        height={1}
                        alignItems="center"
                        justifyContent="center"
                        onMouseDown={confirmPollingInterval}
                      >
                        <text fg="#4ADE80">✓</text>
                      </box>
                      <box
                        width={3}
                        height={1}
                        alignItems="center"
                        justifyContent="center"
                        onMouseDown={() => {
                          setIsPollingIntervalEditing(false);
                          setPollingIntervalError("");
                        }}
                      >
                        <text fg="#FB7185">×</text>
                      </box>
                    </box>
                    {pollingIntervalError ? (
                      <text fg="#FB7185">{pollingIntervalError}</text>
                    ) : null}
                  </>
                ) : (
                  <box height={1} flexDirection="row" alignItems="center" gap={1}>
                    <text fg="#C7D2E9">Polling: {pollingIntervalMs} ms</text>
                    <box
                      width={6}
                      height={1}
                      alignItems="center"
                      justifyContent="center"
                      onMouseDown={editPollingInterval}
                    >
                      <text fg="#60A5FA">Edit</text>
                    </box>
                  </box>
                )}
              </box>
            ) : null}
          </box>
        </box>
        <box height={3} flexDirection="row" alignItems="center" gap={1}>
          <box width={30} height={3} position="relative" zIndex={1_500}>
            <box
              width={30}
              height={3}
              backgroundColor="#253552"
              paddingLeft={1}
              paddingRight={1}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              onMouseDown={() => {
                closeQueueInfo();
                setIsQueueOptionsOpen(false);
                setIsStatusFilterOpen((isOpen) => !isOpen);
              }}
            >
              <text fg="#C7D2E9">
                Status: {jobsStatusFilter ?? "all"}
              </text>
              <text fg="#8EA2C9">{isStatusFilterOpen ? "▴" : "▾"}</text>
            </box>

            {isStatusFilterOpen ? (
              <box
                position="absolute"
                top={3}
                left={0}
                zIndex={2_000}
                width={30}
                height={statusFilterOptions.length * 3 + 2}
                border
                borderColor="#3B82F6"
                backgroundColor="#000000"
                flexDirection="column"
              >
                {statusFilterOptions.map((option) => {
                  const isSelected = jobsStatusFilter === option.value;

                  return (
                    <box
                      key={option.label}
                      width="100%"
                      height={3}
                      paddingLeft={1}
                      paddingRight={1}
                      backgroundColor={isSelected ? "#1D4ED8" : "#000000"}
                      alignItems="flex-start"
                      justifyContent="center"
                      onMouseDown={() => {
                        setIsStatusFilterOpen(false);
                        void filterJobsByStatus(option.value);
                      }}
                    >
                      <text fg={isSelected ? "#FFFFFF" : "#8290AA"}>
                        {option.label}
                      </text>
                    </box>
                  );
                })}
              </box>
            ) : null}
          </box>
          <box
            width={14}
            height={3}
            backgroundColor="#2563EB"
            alignItems="center"
            justifyContent="center"
            onMouseDown={openAddJob}
          >
            <text fg="#FFFFFF">Add Job</text>
          </box>
          <box width={5} height={3} position="relative" zIndex={1_500}>
            <box
              width={5}
              height={3}
              backgroundColor="#253552"
              alignItems="center"
              justifyContent="center"
              onMouseDown={() => {
                closeQueueInfo();
                setIsStatusFilterOpen(false);
                setIsQueueOptionsOpen((isOpen) => !isOpen);
              }}
            >
              <text fg="#C7D2E9">⋮</text>
            </box>

            {isQueueOptionsOpen ? (
              <box
                position="absolute"
                top={3}
                right={0}
                zIndex={2_000}
                width={20}
                height={13}
                border
                borderColor="#253552"
                backgroundColor="#000000"
                flexDirection="column"
                gap={1}
              >
                <box
                  width="100%"
                  height={1}
                  paddingLeft={1}
                  paddingRight={1}
                  alignItems="flex-start"
                  onMouseDown={() => {
                    if (changingQueueStatus) return;
                    setIsQueueOptionsOpen(false);
                    void setQueuePaused(selectedQueue, !isQueuePaused);
                  }}
                >
                  <text fg="#C7D2E9">
                    {changingQueueStatus
                      ? isQueuePaused
                        ? "Resuming..."
                        : "Pausing..."
                      : isQueuePaused
                        ? "Resume queue"
                        : "Pause queue"}
                  </text>
                </box>
                <box
                  width="100%"
                  height={1}
                  paddingLeft={1}
                  paddingRight={1}
                  alignItems="flex-start"
                  onMouseDown={() => {
                    setIsQueueOptionsOpen(false);
                    setRateLimitDuration("");
                    setRateLimitError("");
                    setIsRateLimitDialogOpen(true);
                  }}
                >
                  <text fg="#C7D2E9">Set rate limit</text>
                </box>
                <box
                  width="100%"
                  height={1}
                  paddingLeft={1}
                  paddingRight={1}
                  alignItems="flex-start"
                  onMouseDown={() => {
                    setIsQueueOptionsOpen(false);
                    setConcurrencyInput(
                      selectedQueueInfo?.meta.concurrency === undefined
                        ? ""
                        : String(selectedQueueInfo.meta.concurrency),
                    );
                    setConcurrencyError("");
                    setIsConcurrencyDialogOpen(true);
                  }}
                >
                  <text fg="#C7D2E9">Set concurrency</text>
                </box>
                <box
                  width="100%"
                  height={1}
                  paddingLeft={1}
                  paddingRight={1}
                  alignItems="flex-start"
                  onMouseDown={() => {
                    setIsQueueOptionsOpen(false);
                    setIsDrainConfirmationOpen(true);
                  }}
                >
                  <text fg="#C7D2E9">Empty queue</text>
                </box>
                <box
                  width="100%"
                  height={1}
                  paddingLeft={1}
                  paddingRight={1}
                  alignItems="flex-start"
                  onMouseDown={() => {
                    setIsQueueOptionsOpen(false);
                    setIsRetryConfirmationOpen(true);
                  }}
                >
                  <text fg="#C7D2E9">Retry failed jobs</text>
                </box>
                <box
                  width="100%"
                  height={1}
                  paddingLeft={1}
                  paddingRight={1}
                  alignItems="flex-start"
                  onMouseDown={() => {
                    setIsQueueOptionsOpen(false);
                    setIsObliterateConfirmationOpen(true);
                  }}
                >
                  <text fg="#FB7185">Obliterate queue</text>
                </box>
              </box>
            ) : null}
          </box>
        </box>
      </box>

      <box
        width="80%"
        height={3}
        alignSelf="center"
        flexDirection="row"
        gap={1}
      >
        <box
          height={3}
          minWidth={0}
          flexGrow={1}
          border
          borderColor="#3B82F6"
          paddingLeft={1}
          paddingRight={1}
        >
          <input
            value={jobSearchInput}
            placeholder="Search jobs by ID or name..."
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            onInput={setJobSearchInput}
            onSubmit={() => void searchJobs(jobSearchInput)}
          />
        </box>
        {isLoadingJobs ? <text fg="#FACC15">Searching...</text> : null}
        {jobSearchInput || jobsSearchQuery ? (
          <box
            width={8}
            height={3}
            backgroundColor="#253552"
            alignItems="center"
            justifyContent="center"
            onMouseDown={() => {
              if (isLoadingJobs) return;
              setJobSearchInput("");
              void searchJobs("");
            }}
          >
            <text fg={isLoadingJobs ? "#59677F" : "#C7D2E9"}>Clear</text>
          </box>
        ) : null}
      </box>

      {isLoadingJobs && jobs.length === 0 ? (
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#FACC15">◌ Loading jobs...</text>
        </box>
      ) : jobs.length === 0 ? (
        <text fg="#8290AA">
          {jobsSearchQuery
            ? `No jobs match "${jobsSearchQuery}".`
            : "No jobs found on this page."}
        </text>
      ) : (
        <scrollbox
          width="80%"
          height="100%"
          minHeight={0}
          flexGrow={1}
          flexShrink={1}
          alignSelf="center"
          focused
          scrollY
          contentOptions={{ flexDirection: "column", gap: 1 }}
        >
          {jobs.map((job, index) => {
            const json = formatJobData(job.data);
            const jsonHeight = json.split("\n").length;
            const isDeleting = deletingJobId === job.id;
            const isRetrying = retryingJobId === job.id;
            const canRetry =
              job.status === "failed" || job.status === "completed";

            return (
              <box
                key={`${job.status}:${job.id}:${index}`}
                width="100%"
                height={jsonHeight + 6}
                flexShrink={0}
                border
                borderColor="#253552"
                paddingLeft={1}
                paddingRight={1}
                flexDirection="column"
                onMouseDown={() => {
                  closeQueueInfo();
                  setIsStatusFilterOpen(false);
                  setIsQueueOptionsOpen(false);
                  void openJobDetails(job.id);
                }}
              >
                <box
                  width="100%"
                  height={3}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <box flexDirection="row" gap={2}>
                    <text fg="#8290AA">ID: {job.id}</text>
                    <text fg="#F3F6FF">Name: {job.name}</text>
                  </box>
                  <box flexDirection="row" alignItems="center" gap={2}>
                    <text fg={statusColors[job.status]}>
                      Status: {job.status}
                    </text>
                    <box
                      width={5}
                      height={3}
                      border
                      borderColor={canRetry ? "#2563EB" : "#253552"}
                      alignItems="center"
                      justifyContent="center"
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        if (canRetry) void retryJob(job.id);
                      }}
                    >
                      <text fg={canRetry ? "#60A5FA" : "#59677F"}>
                        {isRetrying ? "◌" : "↻"}
                      </text>
                    </box>
                    <box
                      width={14}
                      height={3}
                      border
                      borderColor="#DC2626"
                      alignItems="center"
                      justifyContent="center"
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        void deleteJob(job.id);
                      }}
                    >
                      <text fg="#FB7185">
                        {isDeleting ? "Deleting..." : "Delete"}
                      </text>
                    </box>
                  </box>
                </box>
                <code
                  width="100%"
                  height={jsonHeight}
                  content={json}
                  filetype="json"
                  syntaxStyle={jsonSyntaxStyle}
                  baseHighlight="default"
                  drawUnstyledText
                />
              </box>
            );
          })}
        </scrollbox>
      )}

      <box
        width="80%"
        alignSelf="center"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <box
          width={14}
          height={3}
          border
          borderColor={canShowPreviousPage ? "#3B82F6" : "#253552"}
          alignItems="center"
          justifyContent="center"
          onMouseDown={showPreviousJobsPage}
        >
          <text fg={canShowPreviousPage ? "#FFFFFF" : "#59677F"}>
            ← Previous
          </text>
        </box>
        <box width={10} height={3} alignItems="center" justifyContent="center">
          <text fg="#8EA2C9">Page {jobsPage}</text>
        </box>
        <box
          width={14}
          height={3}
          border
          borderColor={canShowNextPage ? "#3B82F6" : "#253552"}
          alignItems="center"
          justifyContent="center"
          onMouseDown={showNextJobsPage}
        >
          <text fg={canShowNextPage ? "#FFFFFF" : "#59677F"}>Next →</text>
        </box>
      </box>

      {!isLoadingJobs && jobsMessage ? (
        <text
          fg={
            jobsMessage.startsWith("Deleted ") ||
            jobsMessage.startsWith("Added ") ||
            jobsMessage.startsWith("Emptied ") ||
            jobsMessage.startsWith("Retried ") ||
            jobsMessage.startsWith("Paused ") ||
            jobsMessage.startsWith("Resumed ") ||
            jobsMessage.startsWith("Set concurrency ") ||
            jobsMessage.startsWith("Rate limited ")
              ? "#4ADE80"
              : "#FB7185"
          }
        >
          {jobsMessage}
        </text>
      ) : null}

      <RateLimitDialog
        isOpen={isRateLimitDialogOpen}
        queueName={selectedQueue.name}
        duration={rateLimitDuration}
        error={rateLimitError}
        isPending={isRateLimitingQueue}
        onDurationChange={(value) => {
          setRateLimitDuration(value);
          setRateLimitError("");
        }}
        onCancel={() => setIsRateLimitDialogOpen(false)}
        onConfirm={() => void confirmRateLimitQueue()}
      />

      <ConcurrencyDialog
        isOpen={isConcurrencyDialogOpen}
        queueName={selectedQueue.name}
        concurrency={concurrencyInput}
        error={concurrencyError}
        isPending={isSettingQueueConcurrency}
        onConcurrencyChange={(value) => {
          setConcurrencyInput(value);
          setConcurrencyError("");
        }}
        onCancel={() => setIsConcurrencyDialogOpen(false)}
        onConfirm={() => void confirmQueueConcurrency()}
      />

      <ConfirmationDialog
        isOpen={isRetryConfirmationOpen}
        title="Retry failed jobs?"
        message={`This moves all failed jobs in ${selectedQueue.name} back to waiting.`}
        confirmLabel="Yes, retry"
        pendingLabel="Retrying..."
        isPending={isRetryingJobs}
        onCancel={() => setIsRetryConfirmationOpen(false)}
        onConfirm={() => void confirmRetryFailedJobs()}
      />

      <ConfirmationDialog
        isOpen={isDrainConfirmationOpen}
        title="Empty queue?"
        message={`This removes all waiting and delayed jobs from ${selectedQueue.name}.`}
        confirmLabel="Yes, empty"
        pendingLabel="Emptying..."
        isPending={isDrainingQueue}
        variant="danger"
        onCancel={() => setIsDrainConfirmationOpen(false)}
        onConfirm={() => void confirmDrainQueue()}
      />

      <ConfirmationDialog
        isOpen={isObliterateConfirmationOpen}
        title="Obliterate queue?"
        message={`This permanently removes ${selectedQueue.name} and all its jobs.`}
        confirmLabel="Yes, obliterate"
        pendingLabel="Obliterating..."
        isPending={isObliteratingQueue}
        variant="danger"
        onCancel={() => setIsObliterateConfirmationOpen(false)}
        onConfirm={() => void confirmObliterateQueue()}
      />

      <JobDetailsModal />
    </box>
  );
}
