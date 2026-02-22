import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Keypair } from "@solana/web3.js";

export const DEFAULT_KEYS_DIR = path.join(process.cwd(), "keys");

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
  return {
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    enc: enc.toString("hex"),
  };
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

export function ensureKeysDir(keysDir = DEFAULT_KEYS_DIR) {
  fs.mkdirSync(keysDir, { recursive: true });
}

export function keyPath(agentId: string, keysDir = DEFAULT_KEYS_DIR) {
  return path.join(keysDir, `${agentId}.json`);
}

export function hasAgentKey(agentId: string, keysDir = DEFAULT_KEYS_DIR) {
  return fs.existsSync(keyPath(agentId, keysDir));
}

export function createAndSaveAgent(
  agentId: string,
  passphrase: string,
  keysDir = DEFAULT_KEYS_DIR
): Keypair {
  ensureKeysDir(keysDir);
  const kp = Keypair.generate();
  const payload = encryptBytes(Buffer.from(kp.secretKey), passphrase);
  fs.writeFileSync(keyPath(agentId, keysDir), JSON.stringify(payload, null, 2));
  return kp;
}

export function loadAgent(
  agentId: string,
  passphrase: string,
  keysDir = DEFAULT_KEYS_DIR
): Keypair {
  const p = keyPath(agentId, keysDir);
  const payload = JSON.parse(fs.readFileSync(p, "utf8"));
  const secret = decryptBytes(payload, passphrase);
  return Keypair.fromSecretKey(new Uint8Array(secret));
}
