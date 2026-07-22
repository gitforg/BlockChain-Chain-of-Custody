# Block-Chain-of-Custody

# Blockchain Chain of Custody

A prototype blockchain-based digital evidence management system that helps register, store, and track digital evidence securely. The project demonstrates how Blockchain, IPFS, PostgreSQL, and Firebase Authentication can be combined to maintain the integrity and traceability of evidence throughout its lifecycle.

> **Note:** This is a prototype built for learning and demonstration purposes. It is not intended for production use.

---

## Features

- Secure login using Firebase Authentication
- Evidence registration
- SHA-256 hash generation for uploaded evidence
- Decentralized file storage using Pinata (IPFS)
- PostgreSQL database integration
- Blockchain-based evidence registration
- Chain of Custody tracking
- Evidence search and filtering
- Dashboard with evidence statistics
- QR Code generation for evidence verification
- MetaMask wallet integration (work in progress)

---

## Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js

**Database**
- PostgreSQL
- Prisma ORM

**Blockchain**
- Solidity
- Hardhat
- Ethers.js

**Authentication**
- Firebase Authentication

**Storage**
- Pinata IPFS

---

## Project Structure

```
Block-Chain-of-Custody/
│
├── frontend/
├── backend/
├── contracts/
├── README.md
└── package.json
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/Block-Chain-of-Custody.git
```

Go to the project folder

```bash
cd Block-Chain-of-Custody
```

Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

Start the project

```bash
# Backend
npm start

# Frontend
npm run dev
```

---

