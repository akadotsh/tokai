import {
  createCliRenderer,
  BoxRenderable,
  ConsolePosition,
} from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState } from "react";
import { redisConnection } from "../server/index";

function App() {
  const [redisUrl, setRedisUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(redisConnection.isConnected);

  const submitRedisUrl = async (value: string) => {
    const url = value.trim();

    if (!url) {
      setMessage("Please enter a Redis URL.");
      return;
    }

    if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
      setMessage("Redis URLs must start with redis:// or rediss://");
      return;
    }

    setRedisUrl(url);

    try {
      setMessage("Connecting to Redis...");
      await redisConnection.connect(url);
      setIsConnected(true);
      setMessage("Connected to Redis.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Could not connect to Redis: ${reason}`);
    }
  };

  const disconnectRedis = async () => {
    try {
      await redisConnection.disconnect();
      setRedisUrl("");
      setMessage("");
      setIsConnected(false);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Could not disconnect from Redis: ${reason}`);
    }
  };

  if (isConnected) {
    return (
      <box
        key="connected-layout"
        id="connected-layout"
        width="100%"
        height="100%"
        backgroundColor="#000000"
        flexDirection="column"
      >
        <box
          width="100%"
          height={5}
          border
          borderColor="#253552"
          paddingLeft={2}
          paddingRight={2}
          flexDirection="row"
          flexShrink={0}
          alignItems="center"
          justifyContent="space-between"
        >
          <text fg="#F3F6FF">TOKAI</text>

          <box
            width={20}
            height={3}
            backgroundColor="#2563EB"
            flexShrink={0}
            alignItems="center"
            justifyContent="center"
            gap={1}
            onMouseDown={disconnectRedis}
          >
            <text fg="#FFFFFF">Disconnect</text>
          </box>
        </box>

        <box flexGrow={1} padding={2} flexDirection="column" gap={1}>
          <text fg="#4ADE80">Connected to Redis</text>
          <text fg="#8290AA">{redisUrl}</text>
          {message.startsWith("Could not disconnect") ? (
            <text fg="#FB7185">{message}</text>
          ) : null}
        </box>
      </box>
    );
  }

  return (
    <box
      key="connection-form-layout"
      id="connection-form-layout"
      width={"100%"}
      height={"100%"}
      backgroundColor="#000"
      alignItems="center"
      justifyContent="center"
    >
      <box
        width={64}
        maxWidth="100%"
        backgroundColor="#000000"
        border
        borderColor="#253552"
        padding={2}
        flexDirection="column"
        gap={1}
      >
        <text fg="#8EA2C9">TOKAI</text>

        <box width={"auto"} height={"auto"} flexDirection="column" gap={1}>
          <text fg="#F3F6FF">Connect to Redis</text>
          <text fg="#8290AA">
            Enter the URL for the Redis instance you want to inspect.
          </text>
          <box flexDirection="column" gap={1} marginTop={1}>
            <text fg="#C7D2E9">Redis URL</text>
            <box border borderColor="#3B82F6" paddingLeft={1} paddingRight={1}>
              <input
                value={redisUrl}
                placeholder="redis://localhost:6379"
                placeholderColor="#59677F"
                textColor="#F3F6FF"
                focused
                onInput={(value) => {
                  setRedisUrl(value);
                  setMessage("");
                }}
                onSubmit={() => submitRedisUrl(redisUrl)}
              />
            </box>

            <box
              width={18}
              height={3}
              backgroundColor="#2563EB"
              alignItems="center"
              justifyContent="center"
              onMouseDown={() => submitRedisUrl(redisUrl)}
            >
              <text fg="#FFFFFF">Submit</text>
            </box>
          </box>
        </box>

        {message ? (
          <text
            fg={
              message === "Connected to Redis."
                ? "#4ADE80"
                : message === "Connecting to Redis..."
                  ? "#FACC15"
                  : "#FB7185"
            }
          >
            {message}
          </text>
        ) : (
          <text fg="#59677F">Press Enter or click Submit · Ctrl+C to quit</text>
        )}
      </box>
    </box>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  useMouse: true,
  consoleOptions: {
    position: ConsolePosition.BOTTOM,
    sizePercent: 30,
  },
});

const main = new BoxRenderable(renderer, {
  id: "main",
  width: "100%",
  height: "100%",
  flexDirection: "column",
});

renderer.root.add(main);

createRoot(renderer).render(<App />);
