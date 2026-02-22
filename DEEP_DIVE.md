# Deep Dive: Agentic Wallet Architecture

## Overview

This project demonstrates a prototype agentic wallet on Solana devnet.

It supports:
- Programmatic key generation
- Encrypted key storage
- Automatic signing
- Policy-controlled execution
- On-chain program interaction

## Architecture

Agent -> Strategy -> Intent -> Policy -> Wallet Engine -> Transaction

### 1. Strategy Layer
Decides what the agent wants to do (transfer, increment counter, etc.)

### 2. Policy Layer
Validates:
- Spend cap
- Allowed recipients
- Allowed programs

Rejects any unsafe action before signing.

### 3. Wallet Engine
- Builds transaction
- Signs automatically
- Simulates or sends
- Logs results

### 4. On-chain Counter Program

Program ID:
BtUk5jpsbzNB2yfR31RXecEHXgcMj4kDabZr3dzKthmW

Each agent has a deterministic PDA:
["counter", authority_pubkey]

Initialize:
Creates PDA and sets count = 0

Increment:
Validates authority
Increments u64 counter

## Security Model (Prototype Scope)

- Encrypted local keys
- Spend cap enforcement
- Recipient allowlist
- Program allowlist
- Simulation mode for safe testing

## Devnet Proof

Example signatures (devnet):

SOL transfer:
3e86DZTkeDL7nQkXG7WRM8cuSDhiSvZ76M6GkZ6wdo4BbKGjJ9k21ZEocB8bkihxGzJdFBMMNYySPGrUtCru473k

Counter increment:
2wCH4rEqoTnkUD3SzCfvZk1E3dnvCY6Aju6VdRwDiYYPxd6RyMdvw8B9dJG5CqwFfBG3B4Cb9ENFWWQCShVQ7eVT

SPL transfer:
53eUWpTH9x9i7VsNXHqK8jCKRpF5b9TdLwRW3i4fMjJTspgjyP94TuB2BLnMe7dKQDr9wxaYCeMnJYVXG8ixL1SW
