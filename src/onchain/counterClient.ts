import { Connection, PublicKey, Transaction, TransactionInstruction, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export const COUNTER_PROGRAM_ID = new PublicKey(
  "BtUk5jpsbzNB2yfR31RXecEHXgcMj4kDabZr3dzKthmW"
);

// PDA seeds = ["counter", authority]
export function counterPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), authority.toBuffer()],
    COUNTER_PROGRAM_ID
  );
}

export async function counterExists(conn: Connection, counter: PublicKey) {
  const info = await conn.getAccountInfo(counter, "confirmed");
  return !!info && info.owner.equals(COUNTER_PROGRAM_ID);
}

function loadIdl(): any {
  const idlPath = path.resolve(
    process.cwd(),
    "onchain/agentic_counter/target/idl/agentic_counter.json"
  );
  return JSON.parse(fs.readFileSync(idlPath, "utf8"));
}

export async function fetchCounter(
  conn: Connection,
  authority: PublicKey
): Promise<null | { authority: string; count: bigint }> {
  const [pda] = counterPda(authority);
  const info = await conn.getAccountInfo(pda, "confirmed");
  if (!info) return null;

  const idl = loadIdl();
  const coder = new anchor.BorshAccountsCoder(idl);
  const decoded: any = coder.decode("Counter", info.data);

  return {
    authority: new PublicKey(decoded.authority).toBase58(),
    count: BigInt(decoded.count?.toString?.() ?? decoded.count ?? 0),
  };
}

// Anchor discriminator = sha256("global:<name>").slice(0,8)
function anchorDiscriminator(method: string): Buffer {
  return createHash("sha256")
    .update(`global:${method}`)
    .digest()
    .subarray(0, 8);
}

export function buildCounterIx(params: {
  authority: PublicKey;
  action: "initialize" | "increment";
}) {
  const { authority, action } = params;
  const [counter] = counterPda(authority);

  const data = anchorDiscriminator(action); // no args
  const keys = [
    { pubkey: counter, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: true },
  ];

  // initialize needs system program
  if (action === "initialize") {
    keys.push({
      pubkey: new PublicKey("11111111111111111111111111111111"),
      isSigner: false,
      isWritable: false,
    });
  }

  return new TransactionInstruction({
    programId: COUNTER_PROGRAM_ID,
    keys,
    data,
  });
}

export async function buildCounterTx(params: {
  conn: Connection;
  kp: Keypair;
  action: "initialize" | "increment";
}) {
  const { conn, kp, action } = params;

  const ix = buildCounterIx({ authority: kp.publicKey, action });
  const tx = new Transaction().add(ix);

  tx.feePayer = kp.publicKey;
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.sign(kp);

  const [pda] = counterPda(kp.publicKey);
  return { tx, blockhash, lastValidBlockHeight, counterPda: pda };
}
