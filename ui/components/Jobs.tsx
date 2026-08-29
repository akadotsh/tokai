import { SyntaxStyle } from "@opentui/core";
import type {
  QueueJobStatus,
  QueueJobSummary,
} from "../../server/index";

type JobsProps = {
  queueName: string;
  jobs: QueueJobSummary[];
  isLoading: boolean;
  message: string;
  onBack: () => void;
};

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

export function Jobs({
  queueName,
  jobs,
  isLoading,
  message,
  onBack,
}: JobsProps) {
  return (
    <box flexGrow={1} padding={2} flexDirection="column" gap={1}>
      <box flexDirection="row" alignItems="center" gap={2}>
        <box
          width={10}
          height={3}
          backgroundColor="#253552"
          alignItems="center"
          justifyContent="center"
          onMouseDown={onBack}
        >
          <text fg="#FFFFFF">← Back</text>
        </box>
        <text fg="#F3F6FF">
          {queueName} · {jobs.length} jobs
        </text>
      </box>

      {isLoading ? (
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg="#FACC15">◌ Loading jobs...</text>
        </box>
      ) : jobs.length === 0 ? (
        <text fg="#8290AA">No jobs found in the first 100 per status.</text>
      ) : (
        <scrollbox width="100%" flexGrow={1} focused scrollY>
          <box width="100%" flexDirection="column" gap={1}>
            {jobs.map((job, index) => {
              const json = formatJobData(job.data);
              const jsonHeight = json.split("\n").length;

              return (
                <box
                  key={`${job.status}:${job.id}:${index}`}
                  width="100%"
                  height={jsonHeight + 4}
                  border
                  borderColor="#253552"
                  paddingLeft={1}
                  paddingRight={1}
                  flexDirection="column"
                >
                  <box
                    width="100%"
                    height={1}
                    flexDirection="row"
                    justifyContent="space-between"
                  >
                    <box flexDirection="row" gap={2}>
                      <text fg="#8290AA">ID: {job.id}</text>
                      <text fg="#F3F6FF">Name: {job.name}</text>
                    </box>
                    <text fg={statusColors[job.status]}>
                      Status: {job.status}
                    </text>
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
          </box>
        </scrollbox>
      )}

      {!isLoading && message ? <text fg="#FB7185">{message}</text> : null}
    </box>
  );
}
