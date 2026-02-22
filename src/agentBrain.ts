import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import type { Intent } from "./lib/types.js";

export type Strategy = {
  name: string;
  decide: (params: {
    conn: Connection;
    agentPubkey: PublicKey;
    balanceSol: number;
  }) => Promise<Intent>;
};

export async function runStrategy(params: {
  conn: Connection;
  strategy: Strategy;
  agentPubkey: PublicKey;
}): Promise<Intent> {
  const { conn, strategy, agentPubkey } = params;

  if (!strategy || typeof (strategy as any).decide !== "function") {
    const keys = strategy ? Object.keys(strategy as any) : [];
    throw new Error(
      `Strategy wiring error: expected {decide()}, got ${typeof strategy} keys=${JSON.stringify(keys)}`
    );
  }

  const balLamports = await conn.getBalance(agentPubkey, "confirmed");
  const balanceSol = balLamports / LAMPORTS_PER_SOL;

  return strategy.decide({ conn, agentPubkey, balanceSol });
}
