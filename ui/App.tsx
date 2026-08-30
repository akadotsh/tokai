import { ConnectionForm } from "./components/ConnectionForm";
import { Layout } from "./components/Layout";
import { useTokai } from "./provider";

export function App() {
  const { state } = useTokai();

  return state.isConnected ? <Layout /> : <ConnectionForm />;
}
