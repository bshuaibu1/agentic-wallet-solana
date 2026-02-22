import type { Strategy } from "../agentBrain.js";
import type { Intent } from "../lib/types.js";

export class CounterIncrementStrategy implements Strategy {
  name = "CounterIncrementStrategy";
  constructor(public agentId: string) {}

  async decide(params: { conn: any; agentPubkey: any; balanceSol: number }): Promise<Intent> {
    const { balanceSol } = params;

    if (balanceSol < 0.002) {
      return {
        kind: "noop",
        agentId: this.agentId,
        reason: `Balance too low for tx fees (${balanceSol.toFixed(6)} SOL)`,
      };
    }

    return {
      kind: "counter_increment",
      agentId: this.agentId,
      reason: "Increment per-agent counter PDA on devnet",
    };
  }
}
