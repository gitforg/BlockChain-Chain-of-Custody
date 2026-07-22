/**
 * grant-roles.js
 * Grants all required roles (OFFICER, ANALYST, COURT) and funds a MetaMask
 * address from Hardhat Account #0 so it can interact with EvidenceRegistry.
 *
 * Usage:
 *   node scripts/grant-roles.js <walletAddress>
 *   node scripts/grant-roles.js   # uses default address from error screenshot
 */

import { ethers } from "ethers";

// ── Config ──────────────────────────────────────────────────────────────────
const RPC_URL            = "http://127.0.0.1:8545";
const DEPLOYER_KEY       = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const REGISTRY_ADDRESS   = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const ETH_TO_FUND        = ethers.parseEther("100"); // 100 test ETH for gas

// Target wallet — CLI arg or default from error screenshot
const TARGET_WALLET = process.argv[2] || "0xd2e5339a2d23245eb0429e340b2dc9c4c04d6f5b";

// Minimal ABI — only what we need
const ABI = [
  "function OFFICER_ROLE() view returns (bytes32)",
  "function ANALYST_ROLE() view returns (bytes32)",
  "function COURT_ROLE()   view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
];

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║        EvidenceRegistry Role Grant Script        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Connect
  const provider  = new ethers.JsonRpcProvider(RPC_URL);
  const deployer  = new ethers.Wallet(DEPLOYER_KEY, provider);
  const registry  = new ethers.Contract(REGISTRY_ADDRESS, ABI, deployer);

  console.log(`📡 RPC:       ${RPC_URL}`);
  console.log(`🔑 Deployer:  ${deployer.address}`);
  console.log(`🎯 Target:    ${TARGET_WALLET}`);
  console.log(`📜 Contract:  ${REGISTRY_ADDRESS}\n`);

  // Verify deployer is admin
  const adminRole   = await registry.DEFAULT_ADMIN_ROLE();
  const isAdmin     = await registry.hasRole(adminRole, deployer.address);
  if (!isAdmin) {
    console.error("❌ Deployer is NOT admin — cannot grant roles.");
    process.exit(1);
  }
  console.log("✅ Deployer is DEFAULT_ADMIN_ROLE\n");

  // Get role hashes
  const [officerRole, analystRole, courtRole] = await Promise.all([
    registry.OFFICER_ROLE(),
    registry.ANALYST_ROLE(),
    registry.COURT_ROLE(),
  ]);

  console.log(`OFFICER_ROLE: ${officerRole}`);
  console.log(`ANALYST_ROLE: ${analystRole}`);
  console.log(`COURT_ROLE:   ${courtRole}\n`);

  // Grant roles — track nonce manually to avoid stale-nonce issues with automining
  const roles = [
    { name: "OFFICER_ROLE", hash: officerRole },
    { name: "ANALYST_ROLE", hash: analystRole },
    { name: "COURT_ROLE",   hash: courtRole   },
  ];

  let nonce = await provider.getTransactionCount(deployer.address);

  for (const r of roles) {
    const already = await registry.hasRole(r.hash, TARGET_WALLET);
    if (already) {
      console.log(`⏭  ${r.name} already granted — skipping`);
    } else {
      process.stdout.write(`⏳ Granting ${r.name} ... `);
      const tx = await registry.grantRole(r.hash, TARGET_WALLET, { nonce: nonce++ });
      await tx.wait();
      console.log(`✅  done  (tx: ${tx.hash})`);
    }
  }

  // Fund the wallet with test ETH for gas
  const balance = await provider.getBalance(TARGET_WALLET);
  console.log(`\n💰 Current balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("1")) {
    process.stdout.write(`⏳ Sending 100 ETH to ${TARGET_WALLET} ... `);
    const tx = await deployer.sendTransaction({ to: TARGET_WALLET, value: ETH_TO_FUND });
    await tx.wait();
    const newBalance = await provider.getBalance(TARGET_WALLET);
    console.log(`✅  done  — new balance: ${ethers.formatEther(newBalance)} ETH`);
  } else {
    console.log("✅ Wallet already funded — no ETH transfer needed");
  }

  // Final verification
  console.log("\n── Verification ────────────────────────────────────");
  for (const r of roles) {
    const granted = await registry.hasRole(r.hash, TARGET_WALLET);
    console.log(`  ${granted ? "✅" : "❌"} ${r.name}: ${granted ? "GRANTED" : "MISSING"}`);
  }

  console.log("\n🎉  All done! The wallet can now register evidence.\n");
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err.message);
  process.exit(1);
});
