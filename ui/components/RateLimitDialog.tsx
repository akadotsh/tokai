import { useKeyboard } from "@opentui/react";

type RateLimitDialogProps = {
  isOpen: boolean;
  queueName: string;
  duration: string;
  error: string;
  isPending: boolean;
  onDurationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function RateLimitDialog({
  isOpen,
  queueName,
  duration,
  error,
  isPending,
  onDurationChange,
  onConfirm,
  onCancel,
}: RateLimitDialogProps) {
  useKeyboard((event) => {
    if (isOpen && !isPending && event.name === "escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  });

  if (!isOpen) return null;

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      zIndex={9_000}
      backgroundColor="#05070DB3"
      alignItems="center"
      justifyContent="center"
    >
      <box
        width={68}
        maxWidth="100%"
        height={18}
        border
        borderColor="#3B82F6"
        backgroundColor="#000000"
        padding={1}
        flexDirection="column"
        gap={1}
      >
        <text fg="#F3F6FF">Set rate limit</text>
        <box
          width="100%"
          height={3}
          flexDirection="row"
          alignItems="center"
          gap={1}
        >
          <text fg="#C7D2E9">Duration</text>
          <box
            height={3}
            minWidth={0}
            flexGrow={1}
            border
            borderColor="#3B82F6"
          >
            <input
              value={duration}
              placeholder="60000"
              placeholderColor="#59677F"
              textColor="#F3F6FF"
              focused
              onInput={onDurationChange}
              onSubmit={onConfirm}
            />
          </box>
          <text fg="#8290AA">ms</text>
        </box>
        <text fg={error ? "#FB7185" : "#8290AA"}>
          {error}
        </text>
        <box
          width="100%"
          height={3}
          flexDirection="row"
          justifyContent="flex-end"
          gap={1}
        >
          <box
            width={12}
            height={3}
            backgroundColor="#253552"
            alignItems="center"
            justifyContent="center"
            onMouseDown={() => {
              if (!isPending) onCancel();
            }}
          >
            <text fg={isPending ? "#59677F" : "#FFFFFF"}>Cancel</text>
          </box>
          <box
            width={20}
            height={3}
            backgroundColor="#2563EB"
            alignItems="center"
            justifyContent="center"
            onMouseDown={() => {
              if (!isPending) onConfirm();
            }}
          >
            <text fg="#FFFFFF">
              {isPending ? "Applying..." : "Apply rate limit"}
            </text>
          </box>
        </box>
      </box>
    </box>
  );
}
