# SKILLS.md — Agentic Wallet Skills (Solana Devnet)

This file describes what an AI agent can safely do with this repository.

## Core abilities
- Create and manage per-agent wallets (keypairs) programmatically
- Sign transactions automatically (no manual signature step)
- Transfer SOL between allowlisted addresses
- Create an SPL mint, mint tokens, and transfer SPL tokens (devnet demo)
- Interact with a test dApp/protocol:
  - Anchor counter program (per-agent PDA) with `initialize` + `increment`

## Safety / policy constraints
The wallet engine enforces a local policy before signing:
- Spend cap (SOL): prevents transfers above a configured limit
- Recipient allowlist: only specific recipients are allowed
- Program allowlist: only specific program IDs are allowed

If a transaction violates policy, it is rejected before signing.

## How to run
### Install
npm install

### Simulation mode (no real transactions)
export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=1 npm run demo

### Live on devnet (sends real transactions)
export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=0 npm run demo

## What the demo does (in order)
1. Reads balances for two agents
2. Transfers a small amount of SOL (subject to spend cap + allowlists)
3. Interacts with the Counter program:
   - first run: `initialize` PDA
   - next runs: `increment` PDA
4. Creates an SPL mint, mints to Agent A, transfers tokens to Agent B

## Devnet program info (test dApp)
- Counter Program ID:
  BtUk5jpsbzNB2yfR31RXecEHXgcMj4kDabZr3dzKthmW
- PDA seeds:
  ["counter", authority_pubkey]

## Verifying a transaction
solana confirm -v <SIGNATURE> --url devnet
