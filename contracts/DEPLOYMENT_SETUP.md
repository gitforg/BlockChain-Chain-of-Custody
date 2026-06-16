# Deployment Guide

## 📋 Overview

This guide explains how to deploy the smart contracts to a local Hardhat node.

---

## ✅ Prerequisites

- Hardhat installed ✓
- Solidity contracts compiled ✓
- Node.js running ✓

---

## 🚀 Deployment Steps

### Step 1: Start Local Hardhat Node

Open **Terminal 1** and run:

```bash
npx hardhat node
```

You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts (10 available) and their test ETH balances:
────────────────────────────────────────────────────────────────────────────
Account #0: 0x1234... (1000 ETH)
Account #1: 0x5678... (1000 ETH)
...
```

**Leave this terminal running!**

---

### Step 2: Deploy Contracts

Open **Terminal 2** and run:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 📊 Expected Output

```
🚀 Starting contract deployment...

📝 Deploying contracts from account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

⏳ Deploying AccessControlManager...
✅ AccessControlManager deployed to: 0x5FbDB2315678afccb333f8a9c45b7d4d3b9bca24

⏳ Deploying EvidenceRegistry...
✅ EvidenceRegistry deployed to: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318

═════════════════════════════════════════════
📋 Deployment Summary
═════════════════════════════════════════════
Deployer:              0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
AccessControlManager:  0x5FbDB2315678afccb333f8a9c45b7d4d3b9bca24
EvidenceRegistry:      0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
═════════════════════════════════════════════

📄 Deployment Info:
{
  "network": "unknown",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "timestamp": "2026-06-16T10:30:45.123Z",
  "contracts": {
    "AccessControlManager": "0x5FbDB2315678afccb333f8a9c45b7d4d3b9bca24",
    "EvidenceRegistry": "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"
  }
}
```

---

## 🔗 Contract Addresses

After deployment, you'll get addresses like:

- **AccessControlManager**: `0x5FbDB2315678afccb333f8a9c45b7d4d3b9bca24`
- **EvidenceRegistry**: `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`

**Save these addresses!** You'll need them for:
- Interaction scripts
- Testing
- Frontend integration

---

## 📝 What the Script Does

The deployment script (`scripts/deploy.ts`):

1. ✅ Gets the deployer account
2. ✅ Deploys `AccessControlManager` contract
3. ✅ Waits for confirmation
4. ✅ Deploys `EvidenceRegistry` contract
5. ✅ Waits for confirmation
6. ✅ Prints contract addresses
7. ✅ Displays deployment summary
8. ✅ Logs deployment info as JSON

---

## 🧪 Verify Deployment

After deployment, verify contracts are working:

### Check AccessControlManager

Create a test file `test-deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const accessControlManagerAddress = "0x5FbDB2315678afccb333f8a9c45b7d4d3b9bca24"; // Use your address
  
  const AccessControlManager = await ethers.getContractAt(
    "AccessControlManager",
    accessControlManagerAddress
  );

  const [account] = await ethers.getSigners();
  
  // Check if deployer is admin
  const isAdmin = await AccessControlManager.isAdmin(account.address);
  console.log(`Is ${account.address} an admin? ${isAdmin}`);
}

main().catch(console.error);
```

Run:
```bash
npx hardhat run test-deploy.ts --network localhost
```

---

## 🔄 Redeploy (Fresh Start)

To redeploy to a fresh local node:

### Terminal 1:
```bash
# Stop the current node (Ctrl+C)
# Start a new node
npx hardhat node
```

### Terminal 2:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 📚 Script Structure

```typescript
// Get signer
const [deployer] = await ethers.getSigners();

// Deploy contract
const Contract = await ethers.getContractFactory("ContractName");
const contract = await Contract.deploy();
await contract.waitForDeployment();

// Get address
const address = await contract.getAddress();
```

---

## ⚠️ Common Issues

### Issue: "Cannot connect to localhost"
- **Solution**: Make sure Terminal 1 is running `npx hardhat node`

### Issue: "Contract not found"
- **Solution**: Contracts must be in `contracts/` folder with `.sol` extension

### Issue: "Compilation error"
- **Solution**: Run `npx hardhat compile` first

### Issue: "Out of gas"
- **Solution**: Contracts should be small enough. Increase gas limit if needed.

---

## 🎯 Next Steps

After deployment:

1. ✅ Save contract addresses
2. ✅ Set up roles in AccessControlManager
3. ✅ Test evidence registration
4. ✅ Test custody transfers
5. ✅ Integrate with frontend

---

## 📋 Files

- `scripts/deploy.ts` - Main deployment script
- `contracts/AccessControlManager.sol` - Access control contract
- `contracts/EvidenceRegistry.sol` - Evidence tracking contract

---

## 🔗 Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Run local node
npx hardhat node

# Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Run tests
npx hardhat test

# Clean artifacts
npx hardhat clean
```

---

## 📞 Support

For issues or questions:
1. Check Hardhat docs: https://hardhat.org/docs
2. Review contract source code
3. Check console output for error messages
