export type Intent =
  | {
      kind: "transfer_sol";
      agentId: string;
      to: string;
      sol: number;
      memo?: string;
      reason?: string;
    }
  | {
      kind: "counter_increment";
      agentId: string;
      reason?: string;
    }
  | {
      kind: "noop";
      agentId: string;
      reason?: string;
    };
