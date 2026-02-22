import fs from "node:fs";
import path from "node:path";

export type LogLine = {
  t: string;
  runId: string;
  agentId: string;
  msg: string;
  extra?: any;
};

export function makeRunId() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function createJsonlLogger(runId: string) {
  const logsDir = path.join(process.cwd(), "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const file = path.join(logsDir, `run-${runId}.jsonl`);

  function write(line: Omit<LogLine, "t" | "runId">) {
    const full: LogLine = { t: new Date().toISOString(), runId, ...line };
    const s = JSON.stringify(full);
    console.log(s);
    fs.appendFileSync(file, s + "\n");
  }

  return { file, write };
}
