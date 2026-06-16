# ⚡ MetaMask Setup - Quick Reference

## 🎯 In 5 Minutes

### What You Need
- ✅ MetaMask browser extension installed
- ✅ Hardhat node running on Terminal 1
- ✅ Contracts deployed on Terminal 2

---

## 🔧 Step 1: Add Network to MetaMask

**Click:** MetaMask Icon → Network Dropdown → Add Network

```
Network Name:     Hardhat Local
RPC URL:          http://127.0.0.1:8545
Chain ID:         31337
Currency Symbol:  ETH
Block Explorer:   (leave blank)
```

**Click Save** ✅

---

## 🔑 Step 2: Import Test Account

**Get Private Key from Terminal 1 Output:**

```
Account #0:  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Copy the private key (without 0x):**
```
ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**In MetaMask:**
1. Click Account Icon → Import Account
2. Select "Private Key" 
3. Paste private key
4. Click Import ✅

**Expected:** Account shows 10,000 ETH balance

---

## 🧪 Step 3: Test Connection

**Terminal 3:**
```bash
cd contracts
npx hardhat console --network localhost
```

**Copy-paste this:**
```javascript
const [signer] = await ethers.getSigners();
await ethers.provider.getBalance(signer.address).then(b => console.log(ethers.formatEther(b), "ETH"));
```

**Expected Output:**
```
10000.0 ETH
```

✅ **You're connected!**

---

## 📊 Network Details

| Item | Value |
|------|-------|
| Network Name | Hardhat Local |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency | ETH |
| Gas Price | Auto |
| Block Time | ~0 sec (instant) |

---

## 🔗 Contract Addresses

Save these for frontend use:

```
AccessControlManager: 0x5FbDB2315678afecb367f032d93F642f64180aa3
EvidenceRegistry:     0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

---

## 👥 Available Test Accounts

| # | Address | Private Key |
|---|---------|-------------|
| 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| 1 | 0x70997970C51812e339D9B73b0245ad59cc7599f0 | 59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| 2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |
| 3 | 0x90F79bf6EB2c4f870365E785982e1F101E93b906 | 7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| 4 | 0x15d34aaf54267DB7d7c367839aaf71A00a2c6a65 | 47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a |

Each account has **10,000 ETH**

---

## 🚀 Full Setup Commands

**Terminal 1 - Start Node:**
```bash
cd contracts
npx hardhat node
```

**Terminal 2 - Deploy Contracts:**
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Terminal 3 - Test Console:**
```bash
cd contracts
npx hardhat console --network localhost
```

---

## ✅ Verification Checklist

- [ ] MetaMask network added
- [ ] Account imported with 10,000 ETH
- [ ] Hardhat console test works
- [ ] Both contracts show correct addresses
- [ ] Can interact with contracts in console

---

## 📚 Full Documentation

For detailed info, see **METAMASK_SETUP.md** in this directory

---

## ⚠️ Important

- 🔴 **NEVER** use these test private keys on mainnet
- 🔴 These keys are publicly known
- 🟢 Only for local development
- 🟢 Fresh accounts generated each node restart

---

## 🎓 What's Next?

1. ✅ Interact with contracts via MetaMask
2. ✅ Build frontend UI
3. ✅ Test complete workflows
4. ✅ Deploy to testnet (Sepolia)
5. ✅ Deploy to mainnet

---

## 📞 Troubleshooting

**MetaMask says "Unknown Network"?**
- Normal for local networks - it works fine ✅

**Connection refused?**
- Check Hardhat node is running in Terminal 1

**Balance shows 0 ETH?**
- Import account again or restart Hardhat node

**Transactions taking long?**
- Local node instant mines, should be immediate
- Check Terminal 1 for any errors

---

**Version:** 1.0  
**Date:** June 16, 2026  
**Status:** ✅ Ready for use
