import { SyntaxStyle } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import type { PropsWithChildren } from "react";
import { useTokai } from "../provider";

const jsonSyntaxStyle = SyntaxStyle.fromStyles({
  default: { fg: "#C7D2E9" },
  property: { fg: "#60A5FA" },
  string: { fg: "#4ADE80" },
  number: { fg: "#FACC15" },
  boolean: { fg: "#A78BFA" },
  null: { fg: "#94A3B8" },
  punctuation: { fg: "#8290AA" },
});

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
}

function formatTimestamp(timestamp: number | null) {
  return timestamp === null ? "—" : new Date(timestamp).toLocaleString();
}

function Section({ children }: PropsWithChildren) {
  return (
    <box
      width="100%"
      flexShrink={0}
      border
      borderColor="#253552"
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
    >
      {children}
    </box>
  );
}

function JsonSection({ title, value }: { title: string; value: unknown }) {
  const content = formatJson(value);
  const height = content.split("\n").length;

  return (
    <Section>
      <text fg="#8EA2C9">{title}</text>
      <code
        width="100%"
        height={height}
        content={content}
        filetype="json"
        syntaxStyle={jsonSyntaxStyle}
        baseHighlight="default"
        drawUnstyledText
      />
    </Section>
  );
}

export function JobDetailsModal() {
  const {
    state: {
      selectedJobId,
      selectedJobDetails,
      isLoadingJobDetails,
      jobDetailsMessage,
    },
    actions: { closeJobDetails },
  } = useTokai();

  useKeyboard((event) => {
    if (selectedJobId && event.name === "escape") {
      event.preventDefault();
      event.stopPropagation();
      closeJobDetails();
    }
  });

  if (!selectedJobId) return null;

  const logs = selectedJobDetails?.logs.length
    ? selectedJobDetails.logs
        .map((log, index) => `[${index + 1}] ${log}`)
        .join("\n")
    : "No logs recorded.";
  const error = selectedJobDetails
    ? [
        selectedJobDetails.failedReason ?? "No failure recorded.",
        ...selectedJobDetails.stackTrace,
      ].join("\n")
    : "";

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      zIndex={10_000}
      backgroundColor="#05070DB3"
      alignItems="center"
      justifyContent="center"
    >
      <box
        width="85%"
        height="85%"
        minHeight={0}
        border
        borderColor="#3B82F6"
        backgroundColor="#000000"
        padding={1}
        flexDirection="column"
        gap={1}
      >
        <box
          width="100%"
          height={3}
          flexShrink={0}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <text fg="#F3F6FF">Job details · {selectedJobId}</text>
          <box
            width={12}
            height={3}
            backgroundColor="#253552"
            alignItems="center"
            justifyContent="center"
            onMouseDown={closeJobDetails}
          >
            <text fg="#FFFFFF">Close</text>
          </box>
        </box>

        {isLoadingJobDetails ? (
          <box flexGrow={1} alignItems="center" justifyContent="center">
            <text fg="#FACC15">Loading job details...</text>
          </box>
        ) : jobDetailsMessage ? (
          <box flexGrow={1} alignItems="center" justifyContent="center">
            <text fg="#FB7185">{jobDetailsMessage}</text>
          </box>
        ) : selectedJobDetails ? (
          <scrollbox
            width="100%"
            height="100%"
            minHeight={0}
            flexGrow={1}
            flexShrink={1}
            focused
            scrollY
            contentOptions={{ flexDirection: "column", gap: 1 }}
          >
            <Section>
              <text fg="#8EA2C9">Overview</text>
              <text fg="#F3F6FF">Name: {selectedJobDetails.name}</text>
              <text fg="#F3F6FF">State: {selectedJobDetails.state}</text>
              <text fg="#C7D2E9">
                Created: {formatTimestamp(selectedJobDetails.timestamp)}
              </text>
              <text fg="#C7D2E9">
                Processed: {formatTimestamp(selectedJobDetails.processedOn)}
              </text>
              <text fg="#C7D2E9">
                Finished: {formatTimestamp(selectedJobDetails.finishedOn)}
              </text>
              <text fg="#C7D2E9">
                Attempts: {selectedJobDetails.attemptsMade} made /{" "}
                {selectedJobDetails.attemptsStarted} started
              </text>
              <text fg="#C7D2E9">
                Priority: {selectedJobDetails.priority} · Delay:{" "}
                {selectedJobDetails.delay}ms · Stalls:{" "}
                {selectedJobDetails.stalledCounter}
              </text>
              <text fg="#C7D2E9">
                Worker: {selectedJobDetails.processedBy ?? "—"}
              </text>
            </Section>

            <Section>
              <text fg="#FB7185">Error</text>
              <text fg={selectedJobDetails.failedReason ? "#FB7185" : "#8290AA"}>
                {error}
              </text>
            </Section>

            <Section>
              <text fg="#8EA2C9">
                Logs ({selectedJobDetails.logsCount})
              </text>
              <text fg="#C7D2E9">{logs}</text>
            </Section>

            <JsonSection title="Data" value={selectedJobDetails.data} />
            <JsonSection title="Progress" value={selectedJobDetails.progress} />
            <JsonSection
              title="Return value"
              value={selectedJobDetails.returnValue}
            />
            <JsonSection title="Options" value={selectedJobDetails.options} />
          </scrollbox>
        ) : null}
      </box>
    </box>
  );
}
