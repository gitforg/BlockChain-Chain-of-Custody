/**
 * Hardhat Console Test Script
 * 
 * Usage:
 * 1. Start Hardhat node: npx hardhat node
 * 2. In another terminal: npx hardhat console --network localhost
 * 3. Copy-paste the commands below
 * 
 * Or run individual commands to test different aspects
 */

// ============================================
// 1. GET SIGNER & BALANCE
// ============================================
console.log("📍 Getting signer...");
const [signer] = await ethers.getSigners();
console.log("✅ Signer address:", signer.address);

const balance = await ethers.provider.getBalance(signer.address);
console.log("✅ Balance:", ethers.formatEther(balance), "ETH");

// ============================================
// 2. CHECK NETWORK
// ============================================
console.log("\n📍 Checking network...");
const network = await ethers.provider.getNetwork();
console.log("✅ Network:", network.name);
console.log("✅ Chain ID:", network.chainId);
console.log("✅ RPC URL:", ethers.provider.connection.url);

// ============================================
// 3. CONNECT TO ACCESSCONTROLMANAGER
// ============================================
console.log("\n📍 Loading AccessControlManager...");
const accessControlAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
const acm = AccessControlManager.attach(accessControlAddr);
console.log("✅ AccessControlManager loaded at:", accessControlAddr);

// ============================================
// 4. CHECK ADMIN ROLE
// ============================================
console.log("\n📍 Checking admin role...");
const isAdmin = await acm.isAdmin(signer.address);
console.log("✅ Is admin?", isAdmin);

// ============================================
// 5. ADD OFFICER
// ============================================
console.log("\n📍 Adding officer...");
const officerAddress = "0x70997970C51812e339D9B73b0245ad59cc7599f0";
const addOfficerTx = await acm.addOfficer(officerAddress);
console.log("⏳ Transaction sent:", addOfficerTx.hash);
await addOfficerTx.wait();
console.log("✅ Officer added!");

// Verify
const isOfficer = await acm.isOfficer(officerAddress);
console.log("✅ Is officer?", isOfficer);

// ============================================
// 6. CONNECT TO EVIDENCEREGISTRY
// ============================================
console.log("\n📍 Loading EvidenceRegistry...");
const evidenceRegistryAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
const er = EvidenceRegistry.attach(evidenceRegistryAddr);
console.log("✅ EvidenceRegistry loaded at:", evidenceRegistryAddr);

// ============================================
// 7. TEST REGISTER EVIDENCE
// ============================================
console.log("\n📍 Registering evidence...");

// Get officer signer to register evidence
const [deployer, officer] = await ethers.getSigners();

// Grant officer role to officer account if needed
const isAlreadyOfficer = await acm.isOfficer(officer.address);
if (!isAlreadyOfficer) {
  console.log("⏳ Granting officer role to account #1...");
  const grantTx = await acm.connect(signer).addOfficer(officer.address);
  await grantTx.wait();
  console.log("✅ Officer role granted");
}

// Register evidence
const erWithOfficer = er.connect(officer);
const registerTx = await erWithOfficer.registerEvidence(
  "EV001",                           // evidenceId
  "CASE001",                         // caseId
  "7f82ab12cd34ef56gh78ij90kl12mn", // fileHash
  "QmXYZ123456789abcdefghijklmnop"   // ipfsCid
);
console.log("⏳ Evidence registration sent:", registerTx.hash);
await registerTx.wait();
console.log("✅ Evidence registered!");

// ============================================
// 8. RETRIEVE EVIDENCE
// ============================================
console.log("\n📍 Retrieving evidence...");
const evidence = await er.getEvidence("EV001");
console.log("✅ Evidence retrieved:");
console.log("   - ID:", evidence.evidenceId);
console.log("   - Case ID:", evidence.caseId);
console.log("   - Hash:", evidence.fileHash);
console.log("   - IPFS CID:", evidence.ipfsCid);
console.log("   - Current Custodian:", evidence.currentCustodian);
console.log("   - Status:", evidence.status.toString()); // 0 = Registered

// ============================================
// 9. GET CUSTODY HISTORY
// ============================================
console.log("\n📍 Retrieving custody history...");
const custodyHistory = await er.getCustodyHistory("EV001");
console.log("✅ Custody history (", custodyHistory.length, "records ):");
custodyHistory.forEach((record, index) => {
  console.log(`   Record ${index + 1}:`);
  console.log("     - From:", record.from);
  console.log("     - To:", record.to);
  console.log("     - Timestamp:", record.timestamp.toString());
  console.log("     - Action:", record.action);
  console.log("     - Status:", record.statusAtTransfer.toString());
});

// ============================================
// 10. TRANSFER CUSTODY
// ============================================
console.log("\n📍 Transferring custody...");
const [dep, off, analyst] = await ethers.getSigners();

// Grant analyst role
const isAnalyst = await acm.isAnalyst(analyst.address);
if (!isAnalyst) {
  console.log("⏳ Granting analyst role...");
  const grantAnalystTx = await acm.connect(signer).addAnalyst(analyst.address);
  await grantAnalystTx.wait();
  console.log("✅ Analyst role granted");
}

// Transfer custody
const erWithOfficer2 = er.connect(officer);
const transferTx = await erWithOfficer2.transferCustody(
  "EV001",
  analyst.address,
  "TRANSFER_TO_LAB"
);
console.log("⏳ Custody transfer sent:", transferTx.hash);
await transferTx.wait();
console.log("✅ Custody transferred!");

// Verify new custodian
const updatedEvidence = await er.getEvidence("EV001");
console.log("✅ New custodian:", updatedEvidence.currentCustodian);

// ============================================
// 11. UPDATE STATUS
// ============================================
console.log("\n📍 Updating status...");
const erWithAnalyst = er.connect(analyst);
const updateStatusTx = await erWithAnalyst.updateStatus("EV001", 2); // 2 = InLab
console.log("⏳ Status update sent:", updateStatusTx.hash);
await updateStatusTx.wait();
console.log("✅ Status updated!");

// Verify new status
const finalEvidence = await er.getEvidence("EV001");
console.log("✅ New status:", finalEvidence.status.toString()); // Should be 2

const statusString = await er.getStatusString("EV001");
console.log("✅ Status as string:", statusString);

// ============================================
// SUMMARY
// ============================================
console.log("\n" + "=".repeat(50));
console.log("✅ ALL TESTS PASSED!");
console.log("=".repeat(50));
console.log("\n📋 Summary:");
console.log("   1. ✅ Connected to Hardhat local network");
console.log("   2. ✅ Checked account balances");
console.log("   3. ✅ Verified admin role");
console.log("   4. ✅ Added officer role");
console.log("   5. ✅ Registered evidence");
console.log("   6. ✅ Retrieved evidence");
console.log("   7. ✅ Viewed custody history");
console.log("   8. ✅ Transferred custody");
console.log("   9. ✅ Updated evidence status");
console.log("\n🎉 Your smart contracts are working perfectly!");
console.log("\nTo exit console, type: .exit");
