import fs from "node:fs";
import path from "node:path";
import type { AgentPolicy } from "./policy.js";

export type AgentConfig = AgentPolicy & {
  id: string;
  strategy?: "simple_transfer" | "treasury" | string;
};

export const AGENTS_DIR = path.join(process.cwd(), "agents");

export function listAgentIds(dir = AGENTS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .sort();
}

/**
 * Reads agents/<id>.json and injects `id` automatically.
 * This avoids requiring users to duplicate the id inside the JSON file.
 */
export function readAgentConfig(id: string, dir = AGENTS_DIR): AgentConfig {
  const file = path.join(dir, `${id}.json`);
  const raw = fs.readFileSync(file, "utf8");
  const cfg = JSON.parse(raw);

  // required fields
  if (cfg.spendCapSol === undefined) throw new Error(`Invalid agent config: missing spendCapSol in ${file}`);
  if (!Array.isArray(cfg.allowRecipients)) throw new Error(`Invalid agent config: allowRecipients must be array in ${file}`);
  if (!Array.isArray(cfg.allowPrograms)) throw new Error(`Invalid agent config: allowPrograms must be array in ${file}`);

  return { id, ...cfg } as AgentConfig;
}
