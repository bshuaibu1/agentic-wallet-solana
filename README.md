# Agentic Wallet (Solana, Devnet)

This project is a working prototype of an agentic wallet on Solana devnet.

It demonstrates:

- Programmatic wallet creation (per-agent keypairs)
- Automatic transaction signing
- SOL transfers
- SPL token minting and transfers
- Interaction with a test on-chain program (Anchor Counter PDA)
- Policy enforcement (spend caps + allowlists)

------------------------------------------------------------

## Quickstart (Judges)

Install dependencies:

npm install

Run in simulation mode (safe):

export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=1 npm run demo

Run live on devnet:

export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=0 npm run demo

------------------------------------------------------------

## Counter Test dApp

Program ID (devnet):

BtUk5jpsbzNB2yfR31RXecEHXgcMj4kDabZr3dzKthmW

PDA seeds:

["counter", authority_pubkey]

Instructions:

- initialize: create PDA + set count = 0
- increment: validate authority + increment counter

------------------------------------------------------------

## Verify Transactions

Confirm a transaction:

solana confirm -v <SIGNATURE> --url devnet

Example successful signatures:

SOL transfer:
3e86DZTkeDL7nQkXG7WRM8cuSDhiSvZ76M6GkZ6wdo4BbKGjJ9k21ZEocB8bkihxGzJdFBMMNYySPGrUtCru473k

Counter increment:
2wCH4rEqoTnkUD3SzCfvZk1E3dnvCY6Aju6VdRwDiYYPxd6RyMdvw8B9dJG5CqwFfBG3B4Cb9ENFWWQCShVQ7eVT

SPL transfer:
53eUWpTH9x9i7VsNXHqK8jCKRpF5b9TdLwRW3i4fMjJTspgjyP94TuB2BLnMe7dKQDr9wxaYCeMnJYVXG8ixL1SW

------------------------------------------------------------

See SKILLS.md for agent-readable capabilities.
See DEEP_DIVE.md for architecture and security design.

------------------------------------------------------------

## What this demo proves

✅ Create wallet programmatically:
- Agents are created automatically if missing keys (see /keys and src/lib/keystore.ts)

✅ Sign transactions automatically:
- demo.ts executes intents via walletEngine.ts using agent keypairs

✅ Hold SOL or SPL:
- demo.ts does SOL send + creates a mint + mints + SPL transfer

✅ Interact with a test dApp/protocol:
- Anchor counter program (per-agent PDA) on devnet
- action: initialize (first run) then increment (next runs)

✅ Open-source + setup:
- README quickstart is runnable
- SKILLS.md + DEEP_DIVE.md included

