import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import {
  assertProgramsAllowed,
  assertRecipientAllowed,
  assertSpendCapSol,
} from "./lib/policy.js";

import type { AgentConfig } from "./lib/agents.js";
import type { Intent } from "./lib/types.js";

import {
  buildCounterTx,
  counterExists,
  COUNTER_PROGRAM_ID,
  counterPda,
  fetchCounter,
} from "./onchain/counterClient.js";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Support BOTH call styles:
// - old: { signer, policy, log }
// - new: { kp, cfg }
export async function executeIntent(params: {
  conn: Connection;
  intent: Intent;
  simulateOnly: boolean;

  kp?: Keypair;
  cfg?: AgentConfig;

  signer?: Keypair;
  policy?: AgentConfig;

  log?: { write: (x: any) => void };
}) {
  const conn = params.conn;
  const intent = params.intent;
  const simulateOnly = params.simulateOnly;

  const kp = params.kp ?? params.signer;
  const cfg = params.cfg ?? params.policy;
  const log = params.log;

  if (!kp) throw new Error("executeIntent: missing signer keypair (kp/signer)");
  if (!cfg) throw new Error("executeIntent: missing agent policy (cfg/policy)");

  if (intent.kind === "noop") {
    return { signature: null as string | null };
  }

  // -----------------------
  // SOL TRANSFER
  // -----------------------
  if (intent.kind === "transfer_sol") {
    assertSpendCapSol(cfg, intent.sol);
    assertRecipientAllowed(cfg, intent.to);

    const programIds = [
      "11111111111111111111111111111111",
      ...(intent.memo ? [MEMO_PROGRAM_ID.toBase58()] : []),
    ];
    assertProgramsAllowed(cfg, programIds);

    const toPk = new PublicKey(intent.to);
    const lamports = Math.round(Number(intent.sol) * LAMPORTS_PER_SOL);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: kp.publicKey,
        toPubkey: toPk,
        lamports,
      })
    );

    if (intent.memo) {
      tx.add(
        new TransactionInstruction({
          programId: MEMO_PROGRAM_ID,
          keys: [],
          data: Buffer.from(String(intent.memo), "utf8"),
        })
      );
    }

    tx.feePayer = kp.publicKey;
    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.sign(kp);

    // ✅ most compatible simulate call
    const sim = await conn.simulateTransaction(tx, [kp], "confirmed");
    if (sim.value.err) {
      throw new Error(
        `Simulation failed for transfer_sol: ${JSON.stringify(sim.value.err)}`
      );
    }

    if (simulateOnly) {
      log?.write?.({
        agentId: intent.agentId,
        msg: "simulation ok",
        extra: { intent },
      });
      return { signature: null as string | null };
    }

    const sig = await sendAndConfirmTransaction(conn, tx, [kp], {
      commitment: "confirmed",
    });

    await conn.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    return { signature: sig };
  }

  // -----------------------
  // COUNTER (DEVNET DAPP)
  // -----------------------
  if (intent.kind === "counter_increment") {
    assertProgramsAllowed(cfg, [COUNTER_PROGRAM_ID.toBase58()]);

    const [counter] = counterPda(kp.publicKey);
    const before = await fetchCounter(conn, kp.publicKey);

    const exists = await counterExists(conn, counter);
    const action = exists ? "increment" : "initialize";

    const { tx } = await buildCounterTx({ conn, kp, action });

    tx.feePayer = kp.publicKey;
    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.sign(kp);

    // ✅ most compatible simulate call
    const sim = await conn.simulateTransaction(tx, [kp], "confirmed");
    if (sim.value.err) {
      throw new Error(
        `Simulation failed for counter_${action}: ${JSON.stringify(sim.value.err)}`
      );
    }

    if (simulateOnly) {
      return {
        signature: null as string | null,
        action,
        counter: counter.toBase58(),
        before: before?.count?.toString?.() ?? null,
        after: null,
      };
    }

    const sig = await sendAndConfirmTransaction(conn, tx, [kp], {
      commitment: "confirmed",
    });

    await conn.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    const after = await fetchCounter(conn, kp.publicKey);

    return {
      signature: sig,
      action,
      counter: counter.toBase58(),
      before: before?.count?.toString?.() ?? null,
      after: after?.count?.toString?.() ?? null,
    };
  }

  const _exhaustive: never = intent;
  return _exhaustive;
}
