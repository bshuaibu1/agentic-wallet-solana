# Agentic Wallet (Solana, Devnet)

An autonomous, policy-controlled agent wallet system on Solana devnet.

This prototype demonstrates how AI agents can:

- Generate and manage their own wallets
- Sign and execute transactions autonomously
- Hold and transfer SOL and SPL tokens
- Interact with on-chain programs (custom Anchor counter PDA)
- Enforce security policies (spend caps + program allowlists)

------------------------------------------------------------


- Programmatic wallet creation (per-agent keypairs)
- Automatic transaction signing
- SOL transfers
- SPL token minting and transfers
- Interaction with a custom Anchor test program (per-agent counter PDA)
- Policy enforcement (spend caps + allowlists)

------------------------------------------------------------

## Quickstart

Install:
npm install

Run (Simulation Mode — no real transactions):
export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=1 npm run demo

Run (Live on Devnet):
export AGENT_KEY_PASSPHRASE="agentic-devnet-demo-2026-weak-password"
SIMULATE_ONLY=0 npm run demo

------------------------------------------------------------

## Counter Test dApp

Program ID (devnet):
BtUk5jpsbzNB2yfR31RXecEHXgcMj4kDabZr3dzKthmW

PDA seeds:
["counter", authority_pubkey]

Instructions:
- initialize — creates the PDA and sets count = 0
- increment — validates authority and increments counter

------------------------------------------------------------

## Example Devnet Run (Verifiable)

Verify transactions:
solana confirm -v <SIGNATURE> --url devnet

Example successful run:

SOL transfer:
54ivTk5AokQJdVpVEJhDF25po2pNDBazbfDiucZRM19HphkVcr2tzTGRZek1sJ7EuLCzbQLhrWQPLdzHexgERE1C

Counter increment:
3bdyscm9KwBiuETPsi3uovv8wrohBNcozxQXmnCvrBfFU61UV6hWdv1ctv9BmbPAn6aSizo9aeeWKageXRDyzVrS

SPL transfer:
EYco4xyHU2hqmUup74zZDMpuGmh3mFUpAkuXD3vS7KX8S2aRhRC8gUn6WMcmSQ2L5jMdVGBS7qejXS62Z2BfixR

------------------------------------------------------------

## Capabilities Demonstrated

- Wallets are created programmatically if no key exists
- Transactions are signed automatically by agent keypairs
- Agents can hold SOL and SPL tokens
- Agents interact with a custom on-chain Anchor program
- Policy layer enforces spend caps and program allowlists

------------------------------------------------------------

See SKILLS.md for agent-readable capabilities.
See DEEP_DIVE.md for architecture and security design.
