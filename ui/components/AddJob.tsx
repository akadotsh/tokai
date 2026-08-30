import type { TextareaRenderable } from "@opentui/core";
import { useRef, useState } from "react";

type AddJobProps = {
  queueName: string;
  name: string;
  data: string;
  message: string;
  isAdding: boolean;
  onNameChange: (value: string) => void;
  onDataChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function AddJob({
  queueName,
  name,
  data,
  message,
  isAdding,
  onNameChange,
  onDataChange,
  onSubmit,
  onBack,
}: AddJobProps) {
  const [focusedField, setFocusedField] = useState<"name" | "data">("name");
  const dataInputRef = useRef<TextareaRenderable>(null);

  return (
    <box
      width="100%"
      height="100%"
      minHeight={0}
      flexGrow={1}
      flexShrink={1}
      padding={2}
      flexDirection="column"
      gap={1}
    >
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
        <text fg="#F3F6FF">Add job to {queueName}</text>
      </box>

      <box
        width={64}
        maxWidth="100%"
        alignSelf="center"
        border
        borderColor="#253552"
        padding={2}
        flexDirection="column"
        gap={1}
      >
        <text fg="#C7D2E9">Job name</text>
        <box
          height={3}
          border
          borderColor="#3B82F6"
          onMouseDown={() => setFocusedField("name")}
        >
          <input
            value={name}
            placeholder="job-name"
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            focused={focusedField === "name"}
            onInput={onNameChange}
            onSubmit={() => setFocusedField("data")}
          />
        </box>

        <text fg="#C7D2E9">Job data (JSON)</text>
        <box
          height={10}
          border
          borderColor="#3B82F6"
          onMouseDown={() => setFocusedField("data")}
        >
          <textarea
            ref={dataInputRef}
            width="100%"
            height="100%"
            initialValue={data}
            placeholder="{}"
            placeholderColor="#59677F"
            textColor="#F3F6FF"
            wrapMode="word"
            focused={focusedField === "data"}
            onContentChange={() =>
              onDataChange(dataInputRef.current?.plainText ?? "")
            }
          />
        </box>

        <box flexDirection="row" gap={1}>
          <box
            width={14}
            height={3}
            backgroundColor="#2563EB"
            alignItems="center"
            justifyContent="center"
            onMouseDown={onSubmit}
          >
            <text fg="#FFFFFF">{isAdding ? "Adding..." : "Add Job"}</text>
          </box>
          <box
            width={12}
            height={3}
            backgroundColor="#253552"
            alignItems="center"
            justifyContent="center"
            onMouseDown={onBack}
          >
            <text fg="#FFFFFF">Cancel</text>
          </box>
        </box>

        {message ? <text fg="#FB7185">{message}</text> : null}
      </box>
    </box>
  );
}
