# ⚡ Quick Start - Deploy Smart Contracts

## 🎯 Two-Step Deployment

### 📍 Terminal 1: Start Local Node

```bash
cd contracts
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts (10 available) and their test ETH balances:
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812e339D9B73b0245ad59cc7599f0 (10000 ETH)
...
```

✅ **Leave this running** (don't close this terminal)

---

### 📍 Terminal 2: Deploy Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Expected Output:**
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
```

✅ **Deployment complete!**

---

## 📌 Your Contract Addresses

Copy these for later use:

```
AccessControlManager:  0x5FbDB2315678afccb333f8a9c45b7d4d3b9bca24
EvidenceRegistry:      0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
```

---

## ✨ What Happened?

1. ✅ Local Hardhat node started (10 test accounts, 10000 ETH each)
2. ✅ AccessControlManager deployed
3. ✅ EvidenceRegistry deployed
4. ✅ Both contracts ready to use

---

## 🔧 Troubleshooting

| Error | Solution |
|-------|----------|
| "Cannot connect to localhost" | Make sure Terminal 1 is running `npx hardhat node` |
| "Contract not found" | Run `npx hardhat compile` first |
| "Compilation failed" | Check contract syntax in `contracts/` folder |

---

## 📚 Next Steps

- 📖 Read [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) for detailed info
- 📖 Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for contract functions
- 📖 Read [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) for data model

---

## 💾 Deployment Script

Location: `scripts/deploy.ts`

The script:
- Deploys AccessControlManager
- Deploys EvidenceRegistry
- Prints addresses
- Displays deployment summary
