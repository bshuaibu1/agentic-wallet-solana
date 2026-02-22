import { PublicKey } from "@solana/web3.js";
import type { Strategy } from "../agentBrain.js";
import type { Intent } from "../lib/types.js";

export class TreasuryAllocatorStrategy implements Strategy {
  name = "TreasuryAllocatorStrategy";
  constructor(
    public agentId: string,
    public worker: PublicKey,
    public spendCapSol: number
  ) {}

  async decide(params: { conn: any; agentPubkey: any; balanceSol: number }): Promise<Intent> {
    const { balanceSol } = params;

    // allocate small funding to the worker, but stay under cap
    const sol = Math.min(0.002, Number(this.spendCapSol || 0));

    if (sol <= 0) {
      return { kind: "noop", agentId: this.agentId, reason: "spendCapSol is 0" };
    }

    if (balanceSol < 0.05) {
      return {
        kind: "noop",
        agentId: this.agentId,
        reason: `Treasury balance low (${balanceSol.toFixed(6)} SOL)`,
      };
    }

    return {
      kind: "transfer_sol",
      agentId: this.agentId,
      to: this.worker.toBase58(),
      sol,
      memo: `TreasuryAllocatorStrategy: allocate ${sol} SOL to worker`,
      reason: `Treasury balance healthy (${balanceSol.toFixed(6)} SOL)`,
    };
  }
}
