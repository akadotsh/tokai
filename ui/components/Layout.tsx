import { Header } from "./Header";
import { Queues } from "./Queues";

type LayoutProps = {
  queues: string[];
  message: string;
  onDisconnect: () => void;
  onRefresh: () => void;
};

export function Layout({
  queues,
  message,
  onDisconnect,
  onRefresh,
}: LayoutProps) {
  return (
    <box
      width="100%"
      height="100%"
      backgroundColor="#000000"
      flexDirection="column"
    >
      <Header onDisconnect={onDisconnect} />
      <Queues queues={queues} message={message} onRefresh={onRefresh} />
    </box>
  );
}
