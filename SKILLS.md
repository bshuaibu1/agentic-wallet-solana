# SKILLS.md — Agentic Wallet Skills (Solana Devnet)

## Capabilities

1. Programmatic wallet creation
2. Automatic transaction signing
3. SOL transfers
4. SPL token minting and transfers
5. On-chain interaction with a Counter PDA program
6. Policy enforcement (spend caps + allowlists)

## Run Instructions

Install:
npm install

Simulate:
export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=1 npm run demo

Live devnet:
export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=0 npm run demo

Verify transaction:
solana confirm -v <SIG> --url devnet
