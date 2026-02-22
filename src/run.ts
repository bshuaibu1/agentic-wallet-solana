import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEVNET = "https://api.devnet.solana.com";
const conn = new Connection(DEVNET, "confirmed");

// --- Simple encrypted key storage (AES-256-GCM) ---
const KEYS_DIR = path.join(process.cwd(), "keys");
fs.mkdirSync(KEYS_DIR, { recursive: true });

function deriveKey(passphrase: string, salt: Buffer) {
  return crypto.scryptSync(passphrase, salt, 32);
}

function encryptBytes(plaintext: Buffer, passphrase: string) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { salt: salt.toString("hex"), iv: iv.toString("hex"), tag: tag.toString("hex"), enc: enc.toString("hex") };
}

function decryptBytes(payload: any, passphrase: string) {
  const salt = Buffer.from(payload.salt, "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const tag = Buffer.from(payload.tag, "hex");
  const enc = Buffer.from(payload.enc, "hex");
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

function saveAgentKey(agentId: string, kp: Keypair, passphrase: string) {
  const secret = Buffer.from(kp.secretKey);
  const payload = encryptBytes(secret, passphrase);
  fs.writeFileSync(path.join(KEYS_DIR, `${agentId}.json`), JSON.stringify(payload, null, 2));
}

function loadAgentKey(agentId: string, passphrase: string): Keypair {
  const p = path.join(KEYS_DIR, `${agentId}.json`);
  const payload = JSON.parse(fs.readFileSync(p, "utf8"));
  const secret = decryptBytes(payload, passphrase);
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

// --- Policies ---
type Policy = {
  spendCapLamports: number;          // max SOL spend per tx
  allowlist: string[];               // allowed recipient addresses (base58)
};

function enforcePolicySOL(to: PublicKey, lamports: number, policy: Policy) {
  if (lamports > policy.spendCapLamports) throw new Error(`Policy: spend cap exceeded (${lamports})`);
  const toStr = to.toBase58();
  if (!policy.allowlist.includes(toStr)) throw new Error(`Policy: recipient not allowlisted (${toStr})`);
}

// --- Logging helper ---
function log(agentId: string, msg: string, extra?: any) {
  const line = { t: new Date().toISOString(), agentId, msg, ...(extra ? { extra } : {}) };
  console.log(JSON.stringify(line));
}

// --- Memo program interaction (tiny “dApp interaction”) ---
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function memoIx(payer: PublicKey, memo: string) {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
    data: Buffer.from(memo, "utf8"),
  });
}

async function main() {
  const passphrase = process.env.AGENT_KEY_PASSPHRASE;
  if (!passphrase) throw new Error("Set AGENT_KEY_PASSPHRASE env var");

  // --- Multi-agent setup ---
  const agents = ["agentA", "agentB"];

  // Create keys if missing
  for (const id of agents) {
    const p = path.join(KEYS_DIR, `${id}.json`);
    if (!fs.existsSync(p)) {
      const kp = Keypair.generate();
      saveAgentKey(id, kp, passphrase);
      log(id, "generated new encrypted key", { pubkey: kp.publicKey.toBase58() });
    }
  }

  // Load agents + attach policies
  const agentState = agents.map((id) => {
    const kp = loadAgentKey(id, passphrase);
    const policy: Policy = {
      spendCapLamports: 0.01 * LAMPORTS_PER_SOL, // spend cap: 0.01 SOL per tx
      allowlist: [], // we’ll set below
    };
    return { id, kp, policy };
  });

  // Allowlist each other (demo: agents can pay each other)
  const pubA = agentState[0].kp.publicKey.toBase58();
  const pubB = agentState[1].kp.publicKey.toBase58();
  agentState[0].policy.allowlist = [pubB];
  agentState[1].policy.allowlist = [pubA];

  // --- Check balances ---
  for (const a of agentState) {
    const bal = await conn.getBalance(a.kp.publicKey);
    log(a.id, "balance", { sol: bal / LAMPORTS_PER_SOL, pubkey: a.kp.publicKey.toBase58() });
  }

  // --- SOL transfer with policy enforcement (A -> B 0.001 SOL) ---
  const from = agentState[0];
  const toPub = agentState[1].kp.publicKey;
  const lamports = 0.001 * LAMPORTS_PER_SOL;

  enforcePolicySOL(toPub, lamports, from.policy);

  {
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: from.kp.publicKey, toPubkey: toPub, lamports }),
      memoIx(from.kp.publicKey, `agentic-wallet demo: ${from.id} paid ${lamports} lamports to ${toPub.toBase58()}`)
    );

    const sig = await sendAndConfirmTransaction(conn, tx, [from.kp], { commitment: "confirmed" });
    log(from.id, "sent SOL transfer + memo", { sig });
  }

  // --- SPL Token demo: mint + transfer ---
  // Mint authority = agentA
  const payer = agentState[0].kp;

  const mint = await createMint(conn, payer, payer.publicKey, null, 6);
  log("agentA", "created mint", { mint: mint.toBase58() });

  const ataA = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);
  const ataB = await getOrCreateAssociatedTokenAccount(conn, payer, mint, agentState[1].kp.publicKey);

  await mintTo(conn, payer, mint, ataA.address, payer, 1_000_000); // 1 token with 6 decimals
  log("agentA", "minted tokens to ATA", { ata: ataA.address.toBase58() });

  const sig2 = await transfer(conn, payer, ataA.address, ataB.address, payer, 250_000); // 0.25 token
  log("agentA", "transferred SPL token to agentB", { sig: sig2, toAta: ataB.address.toBase58() });

  log("system", "done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
