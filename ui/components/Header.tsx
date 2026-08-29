type HeaderProps = {
  onDisconnect: () => void;
};

export function Header({ onDisconnect }: HeaderProps) {
  return (
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
        onMouseDown={onDisconnect}
      >
        <text fg="#FFFFFF">Disconnect</text>
      </box>
    </box>
  );
}
