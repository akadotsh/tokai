import { useTokai } from "../provider";

export function ConnectionForm() {
  const {
    state: { redisUrl, message },
    actions: { setRedisUrl, connect },
  } = useTokai();

  return (
    <box
      width="100%"
      height="100%"
      backgroundColor="#000000"
      alignItems="center"
      justifyContent="center"
    >
      <box
        width={64}
        maxWidth="100%"
        border
        borderColor="#253552"
        padding={2}
        flexDirection="column"
        gap={1}
      >
        <text fg="#8EA2C9">TOKAI</text>
        <text fg="#F3F6FF">Connect to Redis</text>
        <text fg="#8290AA">
          Enter the URL for the Redis instance you want to inspect.
        </text>

        <text fg="#C7D2E9">Redis URL</text>
        <box border borderColor="#3B82F6" paddingLeft={1} paddingRight={1}>
          <input
            value={redisUrl}
            placeholder="redis://localhost:6379"
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            focused
            onInput={setRedisUrl}
            onSubmit={connect}
          />
        </box>

        <box
          width={18}
          height={3}
          backgroundColor="#2563EB"
          alignItems="center"
          justifyContent="center"
          onMouseDown={connect}
        >
          <text fg="#FFFFFF">Submit</text>
        </box>

        {message ? (
          <text fg={message === "Connecting to Redis..." ? "#FACC15" : "#FB7185"}>
            {message}
          </text>
        ) : (
          <text fg="#59677F">Press Enter or click Submit · Ctrl+C to quit</text>
        )}
      </box>
    </box>
  );
}
