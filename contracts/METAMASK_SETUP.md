# 🦊 MetaMask + Hardhat Setup Guide

## Step 1: Open MetaMask & Add Network

1. Click the **MetaMask extension** icon (top right)
2. Look for **Network selector** dropdown (currently shows "Ethereum Mainnet" or similar)
3. Click the dropdown → **Add network**

---

## Step 2: Enter Hardhat Network Details

Fill in these fields:

| Field | Value |
|-------|-------|
| **Network Name** | `Hardhat Local` |
| **RPC URL** | `http://127.0.0.1:8545` |
| **Chain ID** | `31337` |
| **Currency Symbol** | `ETH` |

**Visual Path:**
```
MetaMask → Settings → Networks → Add a network
                                 ↓
         Network Name:    Hardhat Local
         RPC URL:         http://127.0.0.1:8545
         Chain ID:        31337
         Currency Symbol: ETH
```

Click **Save** ✅

---

## Step 3: Import Test Account

### Get Private Key from Hardhat

When you run `npx hardhat node`, it displays account details:

```
Account #0:  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1:  0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Copy Account #0 private key** (without the `0x` prefix):
```
ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Import into MetaMask

1. Click MetaMask → **Account icon** (top right)
2. Click **Import Account**
3. Select import method: **Private Key**
4. Paste the private key
5. Click **Import** ✅

You should now see the account with **10,000 ETH** balance! 🎉

---

## Step 4: Verify Connection

### Method 1: Check in MetaMask

- Network should show: **Hardhat Local**
- Account should show: **10,000 ETH**

### Method 2: Use Hardhat Console

In a terminal, run:

```bash
cd contracts
npx hardhat console --network localhost
```

Then in the console:

```javascript
> const [signer] = await ethers.getSigners();
> signer.address
'0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'

> const balance = await ethers.provider.getBalance(signer.address);
> ethers.formatEther(balance)
'10000.0'
```

Expected output: `'10000.0'` ✅

---

## Step 5: Test with Your Contracts

### In Hardhat Console:

```javascript
// Get contract addresses from deployment
const accessControlAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const evidenceRegistryAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Load contracts
const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
const acm = AccessControlManager.attach(accessControlAddr);

// Check if deployer is admin
const [admin] = await ethers.getSigners();
const isAdmin = await acm.isAdmin(admin.address);
console.log("Is admin?", isAdmin); // Should be true

// Add an officer (Account #1)
const officer = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
await acm.addOfficer(officer);
console.log("Officer added!");

// Verify officer role
const isOfficer = await acm.isOfficer(officer);
console.log("Is officer?", isOfficer); // Should be true
```

---

## 📋 Test Accounts (from Hardhat)

Copy any of these private keys to import:

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812e339D9B73b0245ad59cc7599f0` | `59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| #3 | `0x90F79bf6EB2c4f870365E785982e1F101E93b906` | `7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| #4 | `0x15d34aaf54267DB7d7c367839aaf71A00a2c6a65` | `47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

---

## 🚀 Full Workflow

### Terminal 1: Start Hardhat Node
```bash
cd contracts
npx hardhat node
```

Wait for output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0:  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

### Terminal 2: Deploy Contracts
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

You'll see:
```
✅ AccessControlManager deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ EvidenceRegistry deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### MetaMask: Add Network & Import Account
1. Add network (see Step 2)
2. Import Account #0 (see Step 3)
3. See 10,000 ETH balance ✅

### Terminal 3: Test with Hardhat Console
```bash
cd contracts
npx hardhat console --network localhost
```

Test commands:
```javascript
> const [signer] = await ethers.getSigners();
> await ethers.provider.getBalance(signer.address);
> console.log(ethers.formatEther(_));
```

---

## ⚠️ Important Notes

⚠️ **These are TEST accounts - DO NOT use on mainnet!**
- Private keys are publicly known
- Only for local development
- Never use on real networks

✅ **Each Hardhat node restart generates new test accounts**
- Chain ID always remains: `31337`
- RPC URL always: `http://127.0.0.1:8545`
- But you may need to re-import accounts

✅ **MetaMask may show "Unknown network"**
- This is normal for local networks
- Functionality remains unchanged

---

## 🧪 Common Commands in Hardhat Console

```javascript
// Get signers
const [deployer, account1, account2] = await ethers.getSigners();

// Check balance
const balance = await ethers.provider.getBalance(deployer.address);
ethers.formatEther(balance);  // Convert to ETH

// Get contract
const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
const acm = AccessControlManager.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Call contract function
await acm.isAdmin(deployer.address);

// Send transaction
const tx = await acm.addOfficer("0x70997970C51812e339D9B73b0245ad59cc7599f0");
await tx.wait();

// Exit console
.exit
```

---

## 🔗 Frontend Integration

Your frontend can now use ethers.js to interact:

```typescript
import { ethers } from "ethers";

// Connect to MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Interact with contract
const accessControlManager = new ethers.Contract(
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  ABI_HERE,
  signer
);

// Call function
await accessControlManager.addOfficer("0x...");
```

---

## ✅ Checklist

- [ ] Hardhat node running on Terminal 1
- [ ] Contracts deployed on Terminal 2
- [ ] MetaMask installed
- [ ] Network added: "Hardhat Local"
- [ ] RPC URL: `http://127.0.0.1:8545`
- [ ] Chain ID: `31337`
- [ ] Account imported with 10,000 ETH
- [ ] Hardhat console test successful

Done! 🎉
