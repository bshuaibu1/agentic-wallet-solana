import { PublicKey } from "@solana/web3.js";
import type { Strategy } from "../agentBrain.js";
import type { Intent } from "../lib/types.js";

export class SimpleTransferStrategy implements Strategy {
  name = "SimpleTransferStrategy";
  constructor(
    public agentId: string,
    public target: PublicKey,
    public spendCapSol: number
  ) {}

  async decide(params: { conn: any; agentPubkey: any; balanceSol: number }): Promise<Intent> {
    const { balanceSol } = params;

    // keep it tiny + under cap
    const sol = Math.min(0.001, Number(this.spendCapSol || 0));

    if (sol <= 0) {
      return { kind: "noop", agentId: this.agentId, reason: "spendCapSol is 0" };
    }

    if (balanceSol < 0.02) {
      return {
        kind: "noop",
        agentId: this.agentId,
        reason: `Balance ${balanceSol.toFixed(6)} SOL < 0.02 SOL`,
      };
    }

    return {
      kind: "transfer_sol",
      agentId: this.agentId,
      to: this.target.toBase58(),
      sol,
      memo: `SimpleTransferStrategy: paying ${sol} SOL`,
      reason: `Balance ${balanceSol.toFixed(6)} SOL >= 0.02 SOL`,
    };
  }
}
