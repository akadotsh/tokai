import { useKeyboard } from "@opentui/react";
import type { CleanableJobStatus } from "../../server/index";

const statusOptions: Array<{
  label: string;
  value: CleanableJobStatus;
  width: number;
}> = [
  { label: "Completed", value: "completed", width: 13 },
  { label: "Failed", value: "failed", width: 10 },
  { label: "Delayed", value: "delayed", width: 11 },
  { label: "Waiting", value: "wait", width: 11 },
  { label: "Prioritized", value: "prioritized", width: 15 },
];

type CleanJobsDialogProps = {
  isOpen: boolean;
  queueName: string;
  status: CleanableJobStatus;
  graceMs: string;
  limit: string;
  error: string;
  isPending: boolean;
  onStatusChange: (status: CleanableJobStatus) => void;
  onGraceMsChange: (value: string) => void;
  onLimitChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CleanJobsDialog({
  isOpen,
  queueName,
  status,
  graceMs,
  limit,
  error,
  isPending,
  onStatusChange,
  onGraceMsChange,
  onLimitChange,
  onConfirm,
  onCancel,
}: CleanJobsDialogProps) {
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
        width={76}
        maxWidth="100%"
        height={24}
        border
        borderColor="#DC2626"
        backgroundColor="#000000"
        padding={1}
        flexDirection="column"
        gap={1}
      >
        <text fg="#F3F6FF">Clean jobs from {queueName}</text>
        <text fg="#8290AA">Remove jobs older than the grace period.</text>
        <box width="100%" height={3} flexDirection="row" gap={1}>
          {statusOptions.map((option) => {
            const isSelected = option.value === status;

            return (
              <box
                key={option.value}
                width={option.width}
                height={3}
                backgroundColor={isSelected ? "#1D4ED8" : "#253552"}
                alignItems="center"
                justifyContent="center"
                onMouseDown={() => {
                  if (!isPending) onStatusChange(option.value);
                }}
              >
                <text fg={isSelected ? "#FFFFFF" : "#C7D2E9"}>
                  {option.label}
                </text>
              </box>
            );
          })}
        </box>
        <box
          width="100%"
          height={3}
          flexDirection="row"
          alignItems="center"
          gap={1}
        >
          <text fg="#C7D2E9">Minimum age</text>
          <box height={3} minWidth={0} flexGrow={1} border>
            <input
              value={graceMs}
              placeholder="86400000"
              placeholderColor="#59677F"
              textColor="#F3F6FF"
              focused
              onInput={onGraceMsChange}
              onSubmit={onConfirm}
            />
          </box>
          <text fg="#8290AA">ms</text>
        </box>
        <box
          width="100%"
          height={3}
          flexDirection="row"
          alignItems="center"
          gap={1}
        >
          <text fg="#C7D2E9">Maximum jobs</text>
          <box height={3} minWidth={0} flexGrow={1} border>
            <input
              value={limit}
              placeholder="1000"
              placeholderColor="#59677F"
              textColor="#F3F6FF"
              onInput={onLimitChange}
              onSubmit={onConfirm}
            />
          </box>
        </box>
        <text fg={error ? "#FB7185" : "#8290AA"}>{error}</text>
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
            backgroundColor="#DC2626"
            alignItems="center"
            justifyContent="center"
            onMouseDown={() => {
              if (!isPending) onConfirm();
            }}
          >
            <text fg="#FFFFFF">
              {isPending ? "Cleaning..." : "Clean jobs"}
            </text>
          </box>
        </box>
      </box>
    </box>
  );
}
