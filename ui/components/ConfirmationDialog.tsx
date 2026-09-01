type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  pendingLabel = "Confirming...",
  cancelLabel = "Cancel",
  isPending = false,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const accentColor = variant === "danger" ? "#DC2626" : "#2563EB";
  const messageColor = variant === "danger" ? "#FB7185" : "#C7D2E9";

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
        width={58}
        maxWidth="100%"
        height={11}
        border
        borderColor={accentColor}
        backgroundColor="#000000"
        padding={1}
        flexDirection="column"
        gap={1}
      >
        <text fg="#F3F6FF">{title}</text>
        <text fg={messageColor}>{message}</text>
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
            <text fg={isPending ? "#59677F" : "#FFFFFF"}>{cancelLabel}</text>
          </box>
          <box
            width={20}
            height={3}
            backgroundColor={accentColor}
            alignItems="center"
            justifyContent="center"
            onMouseDown={() => {
              if (!isPending) onConfirm();
            }}
          >
            <text fg="#FFFFFF">
              {isPending ? pendingLabel : confirmLabel}
            </text>
          </box>
        </box>
      </box>
    </box>
  );
}
