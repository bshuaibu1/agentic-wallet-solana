import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { COUNTER_PROGRAM_ID, counterPda, counterExists, loadCounterProgram } from "./counterClient.js";

export async function ensureCounterInitialized(params: {
  conn: Connection;
  wallet: anchor.Wallet;
  authority: PublicKey;
}) {
  const { conn, wallet, authority } = params;
  const [pda] = counterPda(authority);

  const exists = await counterExists(conn, pda);
  if (exists) return { counterPda: pda, created: false };

  const program = loadCounterProgram(conn, wallet);

  await program.methods
    .initCounter()
    .accounts({
      counter: pda,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { counterPda: pda, created: true };
}

export async function incrementCounter(params: {
  conn: Connection;
  wallet: anchor.Wallet;
  authority: PublicKey;
}) {
  const { conn, wallet, authority } = params;
  const [pda] = counterPda(authority);
  const program = loadCounterProgram(conn, wallet);

  const sig = await program.methods
    .increment()
    .accounts({
      counter: pda,
      authority,
    })
    .rpc();

  return { sig, counterPda: pda };
}

export function counterProgramId(): PublicKey {
  return COUNTER_PROGRAM_ID;
}
