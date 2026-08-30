import {
  createCliRenderer,
  BoxRenderable,
  ConsolePosition,
} from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App";
import { TokaiProvider } from "./provider";

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
createRoot(renderer).render(
  <TokaiProvider>
    <App />
  </TokaiProvider>,
);
