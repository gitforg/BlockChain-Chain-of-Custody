import { ethers } from "ethers";
import AccessControlManagerArtifact from "../artifacts/contracts/AccessControlManager.sol/AccessControlManager.json" assert { type: "json" };
import EvidenceRegistryArtifact from "../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json" assert { type: "json" };

async function main() {
  console.log("🚀 Starting contract deployment...\n");

  // Get provider and signer
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );

  console.log(`📝 Deploying contracts from account: ${signer.address}\n`);

  // Deploy AccessControlManager
  console.log("⏳ Deploying AccessControlManager...");
  const AccessControlManagerFactory = new ethers.ContractFactory(
    AccessControlManagerArtifact.abi,
    AccessControlManagerArtifact.bytecode,
    signer
  );
  const accessControlManager = await AccessControlManagerFactory.deploy();
  await accessControlManager.waitForDeployment();
  const accessControlManagerAddress = await accessControlManager.getAddress();
  console.log(`✅ AccessControlManager deployed to: ${accessControlManagerAddress}\n`);

  // Small delay to let the blockchain settle
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Deploy EvidenceRegistry
  console.log("⏳ Deploying EvidenceRegistry...");
  const EvidenceRegistryFactory = new ethers.ContractFactory(
    EvidenceRegistryArtifact.abi,
    EvidenceRegistryArtifact.bytecode,
    signer
  );
  const evidenceRegistry = await EvidenceRegistryFactory.deploy();
  await evidenceRegistry.waitForDeployment();
  const evidenceRegistryAddress = await evidenceRegistry.getAddress();
  console.log(`✅ EvidenceRegistry deployed to: ${evidenceRegistryAddress}\n`);

  // Print summary
  console.log("═════════════════════════════════════════════");
  console.log("📋 Deployment Summary");
  console.log("═════════════════════════════════════════════");
  console.log(`Deployer:              ${signer.address}`);
  console.log(
    `AccessControlManager:  ${accessControlManagerAddress}`
  );
  console.log(
    `EvidenceRegistry:      ${evidenceRegistryAddress}`
  );
  console.log("═════════════════════════════════════════════\n");

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    deployer: signer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AccessControlManager: accessControlManagerAddress,
      EvidenceRegistry: evidenceRegistryAddress,
    },
  };

  console.log("📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
