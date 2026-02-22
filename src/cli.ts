import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { listAgentIds, readAgentConfig } from "./lib/agents.js";
import { hasAgentKey, createAndSaveAgent, loadAgent } from "./lib/keystore.js";

const DEVNET = "https://api.devnet.solana.com";
const conn = new Connection(DEVNET, "confirmed");

function arg(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function balances() {
  const passphrase = process.env.AGENT_KEY_PASSPHRASE;
  if (!passphrase) throw new Error("Set AGENT_KEY_PASSPHRASE");
  const ids = listAgentIds();
  for (const id of ids) {
    const kp = loadAgent(id, passphrase);
    const bal = await conn.getBalance(kp.publicKey);
    console.log(`${id}: ${bal / LAMPORTS_PER_SOL} SOL  ${kp.publicKey.toBase58()}`);
  }
}

function createAgent() {
  const passphrase = process.env.AGENT_KEY_PASSPHRASE;
  if (!passphrase) throw new Error("Set AGENT_KEY_PASSPHRASE");
  const id = arg("--id");
  if (!id) throw new Error("Usage: create-agent --id <agentId>");
  if (hasAgentKey(id)) throw new Error(`Key already exists for ${id}`);
  const kp = createAndSaveAgent(id, passphrase);
  console.log(`created ${id}: ${kp.publicKey.toBase58()}`);
}

function showPolicy() {
  const id = arg("--id");
  if (!id) throw new Error("Usage: policy --id <agentId>");
  const cfg = readAgentConfig(id);
  console.log(JSON.stringify(cfg, null, 2));
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd || ["-h", "--help", "help"].includes(cmd)) {
    console.log(`Commands:
  balances                 Show SOL balances for all agents (needs AGENT_KEY_PASSPHRASE)
  create-agent --id <id>   Create and encrypt a new agent key
  policy --id <id>         Print agent policy config
  demo                     Run the full demo (same as: npm run demo)
`);
    return;
  }

  if (cmd === "balances") return balances();
  if (cmd === "create-agent") return createAgent();
  if (cmd === "policy") return showPolicy();
  if (cmd === "demo") {
    console.log("Run: npm run demo");
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
