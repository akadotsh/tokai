import { useTokai } from "../provider";
import { AddJob } from "./AddJob";
import { Header } from "./Header";
import { Jobs } from "./Jobs";
import { Queues } from "./Queues";

export function Layout() {
  const { selectedQueue, isAddJobScreenOpen } = useTokai().state;

  return (
    <box
      width="100%"
      height="100%"
      backgroundColor="#000000"
      flexDirection="column"
    >
      <Header />
      {selectedQueue && isAddJobScreenOpen ? (
        <AddJob />
      ) : selectedQueue ? (
        <Jobs />
      ) : (
        <Queues />
      )}
    </box>
  );
}
