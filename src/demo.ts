import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";

import { createJsonlLogger, makeRunId } from "./lib/log.js";
import { listAgentIds, readAgentConfig } from "./lib/agents.js";
import { createAndSaveAgent, hasAgentKey, loadAgent } from "./lib/keystore.js";

import { runStrategy } from "./agentBrain.js";
import { executeIntent } from "./walletEngine.js";
import { SimpleTransferStrategy } from "./strategies/simpleTransferStrategy.js";
import { TreasuryAllocatorStrategy } from "./strategies/treasuryAllocatorStrategy.js";
import { CounterIncrementStrategy } from "./strategies/counterIncrementStrategy.js";

const DEVNET = "https://api.devnet.solana.com";
const SIMULATE_ONLY = process.env.SIMULATE_ONLY === "1";

function pickStrategy(params: { actorId: string; actorCfg: any; targetPubkey: any }) {
  const { actorId, actorCfg, targetPubkey } = params;
  const spendCapSol = Number(actorCfg.spendCapSol ?? 0);
  const strategyKey = String(actorCfg.strategy ?? "simple_transfer");

  if (strategyKey === "treasury") return new TreasuryAllocatorStrategy(actorId, targetPubkey, spendCapSol);
  if (strategyKey === "counter_increment") return new CounterIncrementStrategy(actorId);
  return new SimpleTransferStrategy(actorId, targetPubkey, spendCapSol);
}

async function main() {
  const passphrase = process.env.AGENT_KEY_PASSPHRASE;
  if (!passphrase) throw new Error("Set AGENT_KEY_PASSPHRASE");

  const runId = makeRunId();
  const log = createJsonlLogger(runId);
  const conn = new Connection(DEVNET, "confirmed");

  log.write({ agentId: "system", msg: "starting demo", extra: { runId, simulateOnly: SIMULATE_ONLY } });

  const agentIds = listAgentIds();
  if (agentIds.length < 2) throw new Error("Need at least two agents in /agents/*.json");

  const agents = agentIds.map((id) => {
    const policy = readAgentConfig(id);
    if (!hasAgentKey(id)) {
      const kp = createAndSaveAgent(id, passphrase);
      log.write({ agentId: id, msg: "generated encrypted key", extra: { pubkey: kp.publicKey.toBase58() } });
      return { id, policy, kp };
    }
    const kp = loadAgent(id, passphrase);
    return { id, policy, kp };
  });

  // snapshot balances
  for (const a of agents) {
    const bal = await conn.getBalance(a.kp.publicKey);
    log.write({
      agentId: a.id,
      msg: "balance",
      extra: { sol: bal / LAMPORTS_PER_SOL, pubkey: a.kp.publicKey.toBase58() },
    });
  }

  // multi-agent round-robin
  for (let i = 0; i < agents.length; i++) {
    const actor = agents[i];
    const target = agents[(i + 1) % agents.length];

    const strategy = pickStrategy({
      actorId: actor.id,
      actorCfg: actor.policy,
      targetPubkey: target.kp.publicKey,
    });

    const intent = await runStrategy({
      conn,
      strategy,
      agentPubkey: actor.kp.publicKey,
    });

    log.write({
      agentId: actor.id,
      msg: "brain decided intent",
      extra: { strategy: strategy.name, target: target.id, intent },
    });

    const res = await executeIntent({
      conn,
      intent,
      signer: actor.kp,
      policy: actor.policy,
      simulateOnly: SIMULATE_ONLY,
      log,
    });

    log.write({
      agentId: actor.id,
      msg: "engine result",
      extra: { signature: res.signature, target: target.id },
    });
  }

  // SPL proof (devnet only)
  if (SIMULATE_ONLY) {
    log.write({ agentId: "system", msg: "SIMULATE_ONLY=1 — skipping SPL demo (needs real send to create accounts)" });
    log.write({ agentId: "system", msg: "done", extra: { logFile: log.file } });
    return;
  }

  const A = agents[0];
  const B = agents[1];

  const mint = await createMint(conn, A.kp, A.kp.publicKey, null, 6);
  log.write({ agentId: A.id, msg: "created mint", extra: { mint: mint.toBase58() } });

  const ataA = await getOrCreateAssociatedTokenAccount(conn, A.kp, mint, A.kp.publicKey);
  const ataB = await getOrCreateAssociatedTokenAccount(conn, A.kp, mint, B.kp.publicKey);

  await mintTo(conn, A.kp, mint, ataA.address, A.kp, 1_000_000);
  log.write({ agentId: A.id, msg: "minted tokens to ATA", extra: { ata: ataA.address.toBase58() } });

  const sig2 = await transfer(conn, A.kp, ataA.address, ataB.address, A.kp, 250_000);
  log.write({ agentId: A.id, msg: "transferred SPL token to agentB", extra: { sig: sig2, toAta: ataB.address.toBase58() } });

  log.write({ agentId: "system", msg: "done", extra: { logFile: log.file } });
}

main().catch((e: any) => {
  console.error(e);
  process.exit(1);
});
