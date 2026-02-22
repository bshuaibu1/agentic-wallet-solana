# Submission Notes (Agentic Wallet — Solana Devnet)

## What this prototype demonstrates
- Programmatic wallet creation (per-agent keypairs)
- Automated transaction signing and execution
- Holding and transferring SOL
- Minting and transferring SPL tokens
- Interaction with a test dApp/protocol:
  - Custom Anchor counter program with per-agent PDA
- Policy enforcement:
  - Spend caps
  - Recipient allowlist
  - Program allowlist

## How to run
See README.md quickstart.

## Key files
- README.md — setup + demo run commands
- SKILLS.md — agent-readable abilities + constraints
- DEEP_DIVE.md — architecture + security design
- src/demo.ts — end-to-end runnable devnet demo
- src/walletEngine.ts — intent execution + policy checks
- src/lib/policy.ts — safety rules (caps + allowlists)
- src/onchain/counterClient.ts — counter PDA interaction
- onchain/agentic_counter — Anchor program source

## Devnet Program ID
BtUk5jpsbzNB2yfR31RXecEHXgcMj4kDabZr3dzKthmW
