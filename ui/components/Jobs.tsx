import { SyntaxStyle } from "@opentui/core";
import { useState } from "react";
import {
  queueJobStatuses,
  type QueueJobStatus,
} from "../../server/index";
import { useTokai } from "../provider";

const statusColors: Record<QueueJobStatus, string> = {
  completed: "#4ADE80",
  failed: "#FB7185",
  delayed: "#FACC15",
  active: "#60A5FA",
  wait: "#C7D2E9",
  "waiting-children": "#A78BFA",
  prioritized: "#F472B6",
  paused: "#94A3B8",
  repeat: "#2DD4BF",
};

const statusFilterOptions: Array<{
  label: string;
  value: QueueJobStatus | null;
}> = [
  { label: "all", value: null },
  ...queueJobStatuses.map((status) => ({
    label: status,
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
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const {
    state: {
      selectedQueue,
      jobs,
      jobsPage,
      jobsTotal,
      hasNextJobsPage,
      jobsStatusFilter,
      isLoadingJobs,
      jobsMessage,
      deletingJobId,
      isObliteratingQueue,
    },
    actions: {
      showQueues,
      deleteJob,
      openAddJob,
      obliterateQueue,
      showPreviousJobsPage,
      showNextJobsPage,
      filterJobsByStatus,
    },
  } = useTokai();

  if (!selectedQueue) return null;

  const canShowPreviousPage = jobsPage > 1 && !isLoadingJobs;
  const canShowNextPage = hasNextJobsPage && !isLoadingJobs;

  return (
    <box
      width="100%"
      height="100%"
      minHeight={0}
      flexGrow={1}
      flexShrink={1}
      overflow="hidden"
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
          <text fg="#F3F6FF">
            {selectedQueue.name} · {jobsTotal} jobs
          </text>
        </box>
        <box height={3} flexDirection="row" alignItems="center" gap={1}>
          <box width={30} height={3} position="relative" zIndex={1_500}>
            <box
              width={30}
              height={3}
              border
              borderColor="#3B82F6"
              paddingLeft={1}
              paddingRight={1}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              onMouseDown={() => setIsStatusFilterOpen((isOpen) => !isOpen)}
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
                height={statusFilterOptions.length + 2}
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
                      height={1}
                      paddingLeft={1}
                      paddingRight={1}
                      backgroundColor={isSelected ? "#1D4ED8" : "#000000"}
                      alignItems="center"
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
          <box
            width={18}
            height={3}
            backgroundColor="#DC2626"
            alignItems="center"
            justifyContent="center"
            onMouseDown={obliterateQueue}
          >
            <text fg="#FFFFFF">
              {isObliteratingQueue ? "Obliterating..." : "Obliterate"}
            </text>
          </box>
        </box>
      </box>

      {isLoadingJobs && jobs.length === 0 ? (
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#FACC15">◌ Loading jobs...</text>
        </box>
      ) : jobs.length === 0 ? (
        <text fg="#8290AA">No jobs found on this page.</text>
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
                      width={14}
                      height={3}
                      border
                      borderColor="#DC2626"
                      alignItems="center"
                      justifyContent="center"
                      onMouseDown={() => deleteJob(job.id)}
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
            jobsMessage.startsWith("Added ")
              ? "#4ADE80"
              : "#FB7185"
          }
        >
          {jobsMessage}
        </text>
      ) : null}
    </box>
  );
}
