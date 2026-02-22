import { PublicKey } from "@solana/web3.js";

export type AgentPolicy = {
  spendCapSol: number;
  allowRecipients: string[]; // base58 pubkeys
  allowPrograms: string[];   // base58 program ids
};

function normPk(x: any) {
  try {
    if (x instanceof PublicKey) return x.toBase58();
    if (typeof x === "string") return new PublicKey(x).toBase58();
    if (x && typeof x.toBase58 === "function") return String(x.toBase58());
    if (x && typeof x.toString === "function") {
      const s = String(x.toString());
      return new PublicKey(s).toBase58();
    }
    return String(x);
  } catch {
    return String(x);
  }
}

export function assertSpendCapSol(policy: AgentPolicy, spendSol: number) {
  if (spendSol > Number(policy.spendCapSol)) {
    throw new Error(`Policy: spend cap exceeded. intended=${spendSol} cap=${policy.spendCapSol}`);
  }
}

export function assertRecipientAllowed(policy: AgentPolicy, recipient: string | PublicKey) {
  const r = normPk(recipient);
  const allowed = new Set((policy.allowRecipients ?? []).map(normPk));
  if (!allowed.has(r)) {
    throw new Error(`Policy: recipient not allowlisted: ${r}`);
  }
}

export function assertProgramsAllowed(policy: AgentPolicy, programIds: Array<string | PublicKey>) {
  const allowed = new Set((policy.allowPrograms ?? []).map(normPk));
  for (const pid of programIds) {
    const p = normPk(pid);
    if (!allowed.has(p)) throw new Error(`Policy: program not allowlisted: ${p}`);
  }
}
