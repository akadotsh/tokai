import { useTokai } from "../provider";

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

export function Queues() {
  const {
    state: { queues, message },
    actions: { fetchQueues, fetchJobs },
  } = useTokai();
  const queueRows = Array.from(
    { length: Math.ceil(queues.length / 2) },
    (_, index) => queues.slice(index * 2, index * 2 + 2),
  );

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
          onMouseDown={fetchQueues}
        >
          <text fg="#FFFFFF">Refresh</text>
        </box>
      </box>

      <box width="100%" flexDirection="column" gap={1}>
        {queueRows.map((row, rowIndex) => (
          <box
            key={row[0]?.name ?? rowIndex}
            width="100%"
            flexDirection="row"
            justifyContent="space-between"
          >
            {row.map(({ name, meta, counts }) => (
              <box
                key={name}
                width="49%"
                height={8}
                border
                borderColor="#253552"
                paddingLeft={1}
                paddingRight={1}
                flexDirection="column"
                onMouseDown={() => fetchJobs(name)}
              >
                <box
                  width="100%"
                  flexDirection="row"
                  justifyContent="space-between"
                >
                  <box flexDirection="column">
                    <text fg="#F3F6FF">{name}</text>
                    {meta.paused ? <text fg="#FACC15">● Paused</text> : null}
                  </box>
                  <text fg="#8EA2C9">→</text>
                </box>
                <box flexDirection="row" gap={2}>
                  <text fg="#4ADE80">completed {counts.completed}</text>
                  <text fg="#FB7185">failed {counts.failed}</text>
                </box>
                <box flexDirection="row" gap={2}>
                  <text fg="#FACC15">delayed {counts.delayed}</text>
                  <text fg="#60A5FA">active {counts.active}</text>
                  <text fg="#C7D2E9">wait {counts.wait}</text>
                </box>
                <box flexDirection="row" gap={2}>
                  <text fg="#A78BFA">
                    waiting-children {counts["waiting-children"]}
                  </text>
                  <text fg="#F472B6">prioritized {counts.prioritized}</text>
                </box>
                <box flexDirection="row" gap={2}>
                  <text fg="#94A3B8">paused {counts.paused}</text>
                  <text fg="#2DD4BF">repeat {counts.repeat}</text>
                </box>
              </box>
            ))}
          </box>
        ))}
      </box>

      {message ? <text fg={getMessageColor(message)}>{message}</text> : null}
    </box>
  );
}
