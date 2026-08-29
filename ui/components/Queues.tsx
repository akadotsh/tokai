type QueuesProps = {
  queues: string[];
  message: string;
  onRefresh: () => void;
};

function getMessageColor(message: string) {
  if (message.startsWith("Found ") || message.startsWith("Metadata for")) {
    return "#4ADE80";
  }

  if (message.startsWith("Scanning ") || message.startsWith("Querying ")) {
    return "#FACC15";
  }

  return "#FB7185";
}

export function Queues({ queues, message, onRefresh }: QueuesProps) {
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

      <box width={64} maxWidth="100%" flexDirection="column" gap={1}>
        {queues.map((queueName) => (
          <box
            key={queueName}
            width="100%"
            height={3}
            border
            borderColor="#253552"
            paddingLeft={1}
            paddingRight={1}
            alignItems="center"
          >
            <text fg="#F3F6FF">{queueName}</text>
          </box>
        ))}
      </box>

      {message ? <text fg={getMessageColor(message)}>{message}</text> : null}
    </box>
  );
}
