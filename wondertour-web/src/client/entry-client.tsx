import { hydrateRoot } from "react-dom/client";
import type { AppData } from "../shared/routes";
import { App } from "./App";
import "./styles.css";

const el = document.getElementById("__APP_DATA__");
const root = document.getElementById("app");
if (el?.textContent && root) {
  const data = JSON.parse(el.textContent) as AppData;
  hydrateRoot(root, <App data={data} />);
}
