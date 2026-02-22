import { PublicKey } from "@solana/web3.js";
import type { Intent } from "../lib/types.js";

export type AgentState = {
  balanceSol: number;
  pubkey: PublicKey;
};

export interface AgentStrategy {
  name: string;
  decide(state: AgentState): Promise<Intent>;
}
