import type { JobCounts } from "../../server/index";

type QueuesProps = {
  queues: JobCounts[];
  message: string;
  onRefresh: () => void;
  onQueueSelect: (queueName: string) => void;
};

function getMessageColor(message: string) {
  if (
    message.startsWith("Found ") ||
    message.startsWith("Metadata for") ||
    message.startsWith("Obliterated ")
  ) {
    return "#4ADE80";
  }

  if (message.startsWith("Scanning ") || message.startsWith("Querying ")) {
    return "#FACC15";
  }

  return "#FB7185";
}

export function Queues({
  queues,
  message,
  onRefresh,
  onQueueSelect,
}: QueuesProps) {
  return (
    <box flexGrow={1} padding={2} flexDirection="column" gap={1}>
      <box flexDirection="row" alignItems="center" gap={2}>
        <text fg="#C7D2E9">BullMQ queues ({queues.length})</text>
        <box
          width={12}
          height={3}
          backgroundColor="#253552"
          alignItems="center"
          justifyContent="center"
          onMouseDown={onRefresh}
        >
          <text fg="#FFFFFF">Refresh</text>
        </box>
      </box>

      <box width="100%" flexDirection="column" gap={1}>
        {queues.map(({ name, counts }) => (
          <box
            key={name}
            width="100%"
            height={5}
            border
            borderColor="#253552"
            paddingLeft={1}
            paddingRight={1}
            alignItems="center"
            flexDirection="row"
            onMouseDown={() => onQueueSelect(name)}
          >
            <text width={20} fg="#F3F6FF">
              {name}
            </text>
            <box flexGrow={1} flexDirection="column">
              <box flexDirection="row" gap={2}>
                <text fg="#4ADE80">completed {counts.completed}</text>
                <text fg="#FB7185">failed {counts.failed}</text>
                <text fg="#FACC15">delayed {counts.delayed}</text>
                <text fg="#60A5FA">active {counts.active}</text>
                <text fg="#C7D2E9">wait {counts.wait}</text>
              </box>
              <box flexDirection="row" gap={2}>
                <text fg="#A78BFA">
                  waiting-children {counts["waiting-children"]}
                </text>
                <text fg="#F472B6">prioritized {counts.prioritized}</text>
                <text fg="#94A3B8">paused {counts.paused}</text>
                <text fg="#2DD4BF">repeat {counts.repeat}</text>
              </box>
            </box>
            <text fg="#8EA2C9">→</text>
          </box>
        ))}
      </box>

      {message ? <text fg={getMessageColor(message)}>{message}</text> : null}
    </box>
  );
}
