const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const REGISTRY_ADDRESS =
  process.env.REGISTRY_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

class ChainSyncService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = null;
    this.started = false;
    this.listenerInstalled = false;
  }

  loadAbi() {
    const artifactPath = path.join(
      __dirname,
      "../../contracts/artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json",
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found at ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return artifact.abi;
  }

  async init() {
    if (this.started) return this.contract;

    const abi = this.loadAbi();
    this.contract = new ethers.Contract(REGISTRY_ADDRESS, abi, this.provider);
    this.started = true;
    return this.contract;
  }

  async getReceiptAndLog(txHash, eventName, evidenceId) {
    await this.init();
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      throw new Error(`Transaction receipt not found for ${txHash}`);
    }

    const parsedEvents = [];
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === eventName) {
          parsedEvents.push(parsed);
        }
      } catch {
        continue;
      }
    }

    const matchedEvent = parsedEvents.find((event) => {
      const eventEvidenceId = event.args?.evidenceId || event.args?.[0];
      return String(eventEvidenceId) === String(evidenceId);
    });

    if (!matchedEvent) {
      throw new Error(`No ${eventName} event found for evidence ${evidenceId}`);
    }

    return { receipt, matchedEvent };
  }

  async syncEvidenceRegistered({
    evidenceId,
    title,
    caseId,
    fileHash,
    ipfsCid,
    creatorWallet,
    txHash,
    blockNumber,
    filePath,
    fileName,
    fileSize,
    classification,
    notes,
    custodian,
    location,
    department,
    uploadedBy,
  }) {
    const existing = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (existing) {
      return existing;
    }

    return prisma.evidence.create({
      data: {
        id: evidenceId,
        title,
        caseId,
        type: fileName ? `${fileName.split(".").pop()?.toUpperCase() || "Binary"} File` : "Digital Evidence",
        classification,
        notes: notes || "",
        custodian,
        currentCustodianWallet: creatorWallet,
        creatorWallet,
        status: "Registered",
        location,
        department,
        fileHash,
        ipfsCid,
        filePath,
        fileName,
        fileSize,
        txHash,
        blockNumber,
        uploadedBy,
      },
    });
  }

  async syncCustodyTransfer({
    evidenceId,
    txHash,
    blockNumber,
    previousCustodianWallet,
    newCustodianWallet,
    newCustodianName,
    department,
    reason,
    action,
    actorEmail,
  }) {
    const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) {
      throw new Error("Evidence record not found");
    }

    const updated = await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        currentCustodianWallet: newCustodianWallet,
        custodian: newCustodianName,
        department,
        txHash,
        blockNumber,
        status:
          department.toLowerCase().includes("laboratory") || department.toLowerCase().includes("forensic")
            ? "InLab"
            : department.toLowerCase().includes("court")
              ? "InCourt"
              : department.toLowerCase().includes("archive") || department.toLowerCase().includes("records")
                ? "Disposed"
                : "InTransit",
      },
    });

    await prisma.custodyEvent.create({
      data: {
        evidenceId,
        actor: newCustodianName,
        department,
        action: action || `Transferred Custody to ${newCustodianName}`,
        status: updated.status,
        note: reason || `Custody handoff completed from ${previousCustodianWallet}.`,
        hash: evidence.fileHash,
        confirmation: `Confirmed Block #${blockNumber}`,
        txHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: actorEmail,
        action: "Transfer Custody",
        status: "Success",
        evidenceId,
        txHash,
        blockNumber,
        previousWallet: previousCustodianWallet,
        newWallet: newCustodianWallet,
        detail: `Wallet-signed custody transfer confirmed for evidence ${evidenceId} from ${previousCustodianWallet} to ${newCustodianWallet}.`,
        ipAddress: "127.0.0.1",
      },
    });

    return updated;
  }

  async start() {
    if (this.listenerInstalled) return;

    try {
      await this.init();
      this.listenerInstalled = true;

      this.contract.on(
        "EvidenceRegistered",
        async (evidenceId, caseId, fileHash, ipfsCid, creatorWallet, timestamp, event) => {
          try {
            const receipt = await this.provider.getTransactionReceipt(
              event?.log?.transactionHash || event?.transactionHash,
            );
            await this.syncEvidenceRegistered({
              evidenceId,
              title: evidenceId,
              caseId,
              fileHash,
              ipfsCid,
              creatorWallet,
              txHash: receipt.hash || receipt.transactionHash,
              blockNumber: Number(receipt.blockNumber || 0),
              filePath: ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : "",
              fileName: `${evidenceId}.bin`,
              fileSize: 0,
              classification: "Restricted",
              notes: "",
              custodian: creatorWallet,
              location: "",
              department: "",
              uploadedBy: "",
            });
          } catch (error) {
            console.warn("[ChainSync] EvidenceRegistered listener failed:", error.message);
          }
        },
      );

      this.contract.on(
        "CustodyTransferred",
        async (evidenceId, previousCustodian, newCustodian, timestamp, event) => {
          try {
            const receipt = await this.provider.getTransactionReceipt(
              event?.log?.transactionHash || event?.transactionHash,
            );
            const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
            if (!evidence) return;

            await prisma.evidence.update({
              where: { id: evidenceId },
              data: {
                currentCustodianWallet: newCustodian,
                txHash: receipt.hash || receipt.transactionHash,
                blockNumber: Number(receipt.blockNumber || 0),
              },
            });
          } catch (error) {
            console.warn("[ChainSync] CustodyTransferred listener failed:", error.message);
          }
        },
      );
    } catch (error) {
      console.warn("[ChainSync] Listener start skipped:", error.message);
    }
  }
}

module.exports = new ChainSyncService();
