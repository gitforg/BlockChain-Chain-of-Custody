const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const REGISTRY_ADDRESS =
  process.env.REGISTRY_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

/**
 * `evidenceId` is declared `string indexed` in EvidenceRegistry, so Solidity
 * stores only its keccak256 hash in the log topic — the original text is not
 * recoverable from the event. ethers v6 therefore hands back an `Indexed`
 * placeholder rather than a string, and a naive `String(arg) === id` comparison
 * always fails. Compare against the hash instead.
 */
function eventArgMatchesEvidenceId(arg, evidenceId) {
  if (arg === undefined || arg === null) return false;

  if (ethers.Indexed.isIndexed(arg)) {
    return String(arg.hash).toLowerCase() === ethers.id(String(evidenceId)).toLowerCase();
  }

  return String(arg) === String(evidenceId);
}

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

  /**
   * Recovers the plain-text evidence ID for a transaction.
   *
   * The emitted event only carries the keccak256 hash of the ID (see
   * eventArgMatchesEvidenceId), but the transaction calldata still holds the
   * original string argument, so decode that instead.
   */
  async resolveEvidenceIdFromTx(txHash) {
    await this.init();

    const tx = await this.provider.getTransaction(txHash);
    if (!tx?.data) return null;

    try {
      const parsed = this.contract.interface.parseTransaction({ data: tx.data, value: tx.value });
      const firstArg = parsed?.args?.[0];
      return firstArg === undefined || firstArg === null ? null : String(firstArg);
    } catch {
      return null;
    }
  }

  /**
   * True when an evidence ID is already claimed on-chain.
   *
   * Registrations are permanent, so an ID can be taken on-chain even after its
   * database row has been destroyed. Returns false if the chain is unreachable
   * so ID allocation degrades to database-only rather than failing outright.
   */
  async isEvidenceRegisteredOnChain(evidenceId) {
    try {
      await this.init();
      const record = await this.contract.evidenceRegistry(evidenceId);
      return Boolean(record?.exists ?? record?.[8]);
    } catch (error) {
      console.warn(`[ChainSync] On-chain ID check skipped: ${error.message}`);
      return false;
    }
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

    const matchedEvent = parsedEvents.find((event) =>
      eventArgMatchesEvidenceId(event.args?.evidenceId ?? event.args?.[0], evidenceId),
    );

    if (!matchedEvent) {
      throw new Error(
        `No ${eventName} event found for evidence ${evidenceId} in transaction ${txHash}. ` +
          `The transaction may have been signed against a different contract or chain.`,
      );
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
        async (indexedEvidenceId, caseId, fileHash, ipfsCid, creatorWallet, timestamp, event) => {
          try {
            const txHash = event?.log?.transactionHash || event?.transactionHash;
            const receipt = await this.provider.getTransactionReceipt(txHash);

            // The event only exposes the hashed ID, so read it back from calldata.
            const evidenceId = await this.resolveEvidenceIdFromTx(txHash);
            if (!evidenceId) {
              console.warn("[ChainSync] Could not resolve evidence ID for tx", txHash);
              return;
            }

            // POST /api/evidence/finalize is the authoritative creator of rows —
            // it has the title, notes, custodian and file metadata that the event
            // does not carry. Creating a placeholder row here would litter the
            // archive with junk entries and resurrect records deleted via
            // "Destroy Record", so only reconcile records we already know about.
            const known = await prisma.evidence.findUnique({ where: { id: evidenceId } });
            if (!known) {
              console.log(
                `[ChainSync] EvidenceRegistered for ${evidenceId} has no local record; leaving creation to /finalize.`,
              );
              return;
            }

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
        async (indexedEvidenceId, previousCustodian, newCustodian, timestamp, event) => {
          try {
            const txHash = event?.log?.transactionHash || event?.transactionHash;
            const receipt = await this.provider.getTransactionReceipt(txHash);

            const evidenceId = await this.resolveEvidenceIdFromTx(txHash);
            if (!evidenceId) return;

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
