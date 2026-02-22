import type { AgentContext } from "../lib/types.js";

export function CounterIncrementStrategy(ctx: AgentContext) {
  return {
    kind: "counter_increment" as const,
    agentId: ctx.actor.id,
    reason: "Increment my own per-agent counter PDA on devnet",
  };
}
