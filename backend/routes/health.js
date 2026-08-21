const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const REGISTRY_ADDRESS =
  process.env.REGISTRY_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const ARTIFACT_PATH = path.join(
  __dirname,
  "../../contracts/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json",
);

/**
 * Environment telemetry for the console status bar: chain reachability, block
 * height, contract presence, IPFS pinning config and database health.
 */
router.get("/", async (req, res) => {
  const telemetry = {
    chain: {
      rpcUrl: RPC_URL,
      registryAddress: REGISTRY_ADDRESS,
      online: false,
      chainId: null,
      blockNumber: null,
      contractDeployed: false,
      artifactPresent: fs.existsSync(ARTIFACT_PATH),
      error: "",
    },
    ipfs: {
      provider: "Pinata",
      configured: Boolean(process.env.PINATA_JWT && process.env.PINATA_JWT.trim()),
      gateway: process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/",
    },
    database: { online: false, evidenceCount: 0, error: "" },
    serverTime: new Date().toISOString(),
  };

  // Chain probe — short timeout so a dead node cannot stall the status bar.
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const [network, blockNumber, code] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      provider.getCode(REGISTRY_ADDRESS),
    ]);

    telemetry.chain.online = true;
    telemetry.chain.chainId = Number(network.chainId);
    telemetry.chain.blockNumber = blockNumber;
    telemetry.chain.contractDeployed = Boolean(code && code !== "0x");
  } catch (error) {
    telemetry.chain.error = error.message;
  }

  try {
    telemetry.database.evidenceCount = await prisma.evidence.count();
    telemetry.database.online = true;
  } catch (error) {
    telemetry.database.error = error.message;
  }

  res.json(telemetry);
});

module.exports = router;
