const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hashService = require("../services/hashService");
const storageService = require("../services/storageService");
const blockchainService = require("../services/blockchainService");
const ipfsService = require("../services/ipfsService");
const chainSyncService = require("../services/chainSyncService");

async function getNextEvidenceId() {
  const year = new Date().getFullYear();
  const count = await prisma.evidence.count();
  const nextSeq = String(count + 1).padStart(4, "0");
  return `EV-${year}-${nextSeq}`;
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Helper to look up active user role
async function getUserRole(email) {
  if (!email) return "Officer";
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? user.role : "Officer";
}

// 0. Prepare Evidence registration payload for wallet signing
router.post("/prepare", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Evidence file payload is required" });
    }

    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = hashService.calculateSha256(fileBuffer);

    let ipfsResult;
    try {
      ipfsResult = await ipfsService.uploadFile(file.path, file.originalname);
    } catch (ipfsError) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Failed to upload evidence payload to IPFS storage: ${ipfsError.message}`);
    }

    const evidenceId = await getNextEvidenceId();

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.json({
      evidenceId,
      fileHash,
      ipfsCid: ipfsResult.ipfsCid,
      gatewayUrl: ipfsResult.gatewayUrl,
      fileName: file.originalname,
      fileSize: file.size,
      timestamp: ipfsResult.timestamp,
    });
  } catch (error) {
    console.error("Prepare evidence error:", error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Temp file cleanup failed:", err);
      }
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 1. Get Evidence (List, Search, Filter, Sort, Paginate)
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      classification = "all",
      custodian = "all",
      caseId = "",
      department = "",
      page = "1",
      limit = "100",
      sort = "uploadedAt",
      order = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query condition
    const where = { AND: [] };

    // Search query mapping (partial match, case insensitive)
    if (search.trim()) {
      const cleanSearch = search.trim();
      where.AND.push({
        OR: [
          { id: { contains: cleanSearch } },
          { caseId: { contains: cleanSearch } },
          { title: { contains: cleanSearch } },
          { type: { contains: cleanSearch } },
          { custodian: { contains: cleanSearch } },
          { notes: { contains: cleanSearch } },
          { txHash: { contains: cleanSearch } },
        ],
      });
    }

    // Filters
    if (status !== "all") {
      where.AND.push({ status: { equals: status } });
    }
    if (classification !== "all") {
      where.AND.push({ classification: { equals: classification } });
    }
    if (custodian !== "all") {
      where.AND.push({ custodian: { contains: custodian } });
    }
    if (caseId.trim()) {
      where.AND.push({ caseId: { contains: caseId.trim() } });
    }
    if (department.trim()) {
      where.AND.push({ department: { contains: department.trim() } });
    }

    // Query DB
    const total = await prisma.evidence.count({ where });
    const items = await prisma.evidence.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sort]: order },
    });

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("List evidence error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Get Evidence Details by ID
router.get("/:id", async (req, res) => {
  try {
    const item = await prisma.evidence.findUnique({
      where: { id: req.params.id },
      include: {
        custodyEvents: {
          orderBy: { time: "asc" },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Evidence record not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Get evidence detail error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Finalize wallet-signed evidence registration
router.post("/finalize", async (req, res) => {
  try {
    const {
      evidenceId,
      title,
      caseId,
      classification = "Restricted",
      notes = "",
      custodian = "Officer Robert Vance",
      location = "Intake Vault Room",
      department = "Intake Division",
      type = "Digital Evidence",
      fileHash,
      ipfsCid,
      filePath,
      fileName,
      fileSize,
      txHash,
      blockNumber,
      creatorWallet,
    } = req.body;

    const userEmail = req.headers["x-user-email"] || "officer@evidencechain.com";

    if (!evidenceId || !title || !caseId || !fileHash || !ipfsCid || !txHash) {
      return res.status(400).json({ error: "Missing registration payload" });
    }

    const { receipt, matchedEvent } = await chainSyncService.getReceiptAndLog(
      txHash,
      "EvidenceRegistered",
      evidenceId,
    );

    const onChainCreator = String(matchedEvent.args?.creatorWallet || matchedEvent.args?.[4] || creatorWallet || "");

    const evidence = await prisma.evidence.create({
      data: {
        id: evidenceId,
        title,
        caseId,
        type,
        classification,
        notes,
        custodian,
        location,
        department,
        status: "Registered",
        fileHash,
        ipfsCid,
        filePath: filePath || `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
        fileName: fileName || `${evidenceId}.bin`,
        fileSize: Number(fileSize || 0),
        creatorWallet: onChainCreator,
        currentCustodianWallet: onChainCreator,
        txHash,
        blockNumber: Number(receipt.blockNumber || blockNumber || 0),
        uploadedBy: userEmail,
      },
    });

    // 6. Create initial CustodyEvent
    await prisma.custodyEvent.create({
      data: {
        evidenceId,
        actor: custodian,
        department,
        action: `Registered Evidence Item ${evidenceId}`,
        status: "Registered",
        note: notes || "Initial registration. Cryptographic SHA-256 fingerprint generated.",
        hash: fileHash,
        confirmation: `Confirmed Block #${receipt.blockNumber || blockNumber || 0}`,
        txHash,
      },
    });

    // 7. Log in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: userEmail,
        action: "Register Evidence",
        status: "Success",
        evidenceId,
        txHash,
        blockNumber: Number(receipt.blockNumber || blockNumber || 0),
        previousWallet: "",
        newWallet: onChainCreator,
        detail: `Evidence ${evidenceId} registered with file hash ${fileHash} and IPFS CID ${ipfsCid} for Case ${caseId}.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    res.status(201).json(evidence);
  } catch (error) {
    console.error("Finalize evidence error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 4. Transfer Custody confirmation after wallet signing
router.post("/:id/transfer", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      txHash,
      previousCustodianWallet = "",
      newCustodianWallet = "",
      newCustodian,
      department,
      reason,
      action,
    } = req.body;
    const userEmail = req.headers["x-user-email"] || "officer@evidencechain.com";

    if (!txHash) {
      return res.status(400).json({ error: "Transaction hash is required for custody confirmation" });
    }
    if (!newCustodianWallet || !/^0x[a-fA-F0-9]{40}$/.test(newCustodianWallet)) {
      return res.status(400).json({ error: "A valid recipient wallet is required" });
    }

    // 1. Fetch evidence
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence record not found" });
    }

    const { receipt, matchedEvent } = await chainSyncService.getReceiptAndLog(
      txHash,
      "CustodyTransferred",
      id,
    );

    const onChainPrevious = String(matchedEvent.args?.previousCustodian || matchedEvent.args?.[1] || "");
    const onChainNew = String(matchedEvent.args?.newCustodian || matchedEvent.args?.[2] || "");

    if (previousCustodianWallet && previousCustodianWallet.toLowerCase() !== onChainPrevious.toLowerCase()) {
      return res.status(400).json({ error: "Previous custodian wallet does not match the blockchain event" });
    }
    if (onChainNew.toLowerCase() !== newCustodianWallet.toLowerCase()) {
      return res.status(400).json({ error: "Recipient wallet does not match the blockchain event" });
    }

    const updated = await chainSyncService.syncCustodyTransfer({
      evidenceId: id,
      txHash,
      blockNumber: Number(receipt.blockNumber || 0),
      previousCustodianWallet: onChainPrevious,
      newCustodianWallet: onChainNew,
      newCustodianName: newCustodian,
      department,
      reason,
      action,
      actorEmail: userEmail,
    });

    return res.json(updated);
  } catch (error) {
    console.error("Transfer custody error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 5. Verify File Hash
router.post("/verify", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { expectedEvidenceId } = req.body;
    const userEmail = req.headers["x-user-email"] || "officer@evidencechain.com";

    if (!file) {
      return res.status(400).json({ error: "Verification file is required" });
    }

    // Calculate SHA-256 hash of the uploaded verification file
    const fileBuffer = fs.readFileSync(file.path);
    const calculatedHash = hashService.calculateSha256(fileBuffer);

    // Delete temp file upload after hashing
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    let match = null;

    if (expectedEvidenceId) {
      // Find evidence and compare
      const record = await prisma.evidence.findUnique({
        where: { id: expectedEvidenceId },
      });

      if (record) {
        const isMatch = record.fileHash.toLowerCase() === calculatedHash.toLowerCase();
        
        // Log event
        await prisma.custodyEvent.create({
          data: {
            evidenceId: expectedEvidenceId,
            actor: userEmail.split("@")[0],
            department: "Audit Division",
            action: "VERIFIED",
            status: record.status,
            note: isMatch 
              ? `Integrity check PASSED. Uploaded file hash matched ledger.` 
              : `Integrity check FAILED. Potential tampering detected! Calculated hash: ${calculatedHash}`,
            hash: calculatedHash,
            txHash: record.txHash,
          },
        });

        // Audit Log
        await prisma.auditLog.create({
          data: {
            actor: userEmail,
            action: "Verify Hash",
            status: isMatch ? "verified" : "tampered",
            evidenceId: expectedEvidenceId,
            detail: isMatch 
              ? `Verification check PASSED for item ${expectedEvidenceId}.` 
              : `Verification FAILED for item ${expectedEvidenceId}. File hashes mismatch.`,
            ipAddress: req.ip || "127.0.0.1",
          },
        });

        return res.json({
          status: isMatch ? "verified" : "tampered",
          calculatedHash,
          evidence: record,
        });
      }
    } else {
      // Search registry for hash
      match = await prisma.evidence.findFirst({
        where: { fileHash: { equals: calculatedHash } },
      });

      if (match) {
        // Log in AuditLog
        await prisma.auditLog.create({
          data: {
            actor: userEmail,
            action: "Verify Hash",
            status: "verified",
            evidenceId: match.id,
            detail: `General ledger query PASSED. File matched evidence record ${match.id}.`,
            ipAddress: req.ip || "127.0.0.1",
          },
        });

        return res.json({
          status: "verified",
          calculatedHash,
          evidence: match,
        });
      }
    }

    // Log unknown check in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: userEmail,
        action: "Verify Hash",
        status: "unknown",
        detail: `Verification checked. Calculated hash ${calculatedHash} was not found on the registry.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    return res.json({
      status: "unknown",
      calculatedHash,
      evidence: null,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Verification temp cleanup failed:", err);
      }
    }
    console.error("Verification API error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Dispose Evidence (Mark status as Disposed in SQL database + Blockchain)
router.post("/:id/dispose", async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.headers["x-user-email"] || "officer@evidencechain.com";

    // 1. Fetch item
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence record not found" });
    }
    if (evidence.status === "Disposed") {
      return res.status(400).json({ error: "Evidence is already disposed" });
    }

    // 2. Perform blockchain disposal
    const txDetails = await blockchainService.disposeEvidence(id);

    // 3. Update status in database
    const updated = await prisma.evidence.update({
      where: { id },
      data: {
        status: "Disposed",
        txHash: txDetails.txHash,
      },
    });

    // 4. Record Disposal Event
    await prisma.custodyEvent.create({
      data: {
        evidenceId: id,
        actor: userEmail.split("@")[0],
        department: "Court Division",
        action: "DISPOSED",
        status: "Disposed",
        note: `Evidence legally disposed of. Cryptographic verification locked in block #${txDetails.blockNumber}.`,
        hash: evidence.fileHash,
        confirmation: `Confirmed Block #${txDetails.blockNumber}`,
        txHash: txDetails.txHash,
      },
    });

    // 5. Log in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: userEmail,
        action: "Dispose Evidence",
        status: "Success",
        evidenceId: id,
        txHash: txDetails.txHash,
        detail: `Evidence item ${id} successfully marked as Disposed in the database and anchored on-chain.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Dispose evidence error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 7. Destroy Evidence Record (Purge metadata, unpin from Pinata IPFS)
router.post("/:id/destroy", async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.headers["x-user-email"] || "admin@evidencechain.com";

    // 1. Fetch item
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence record not found" });
    }

    // 2. Unpin from Pinata IPFS if CID exists
    if (evidence.ipfsCid) {
      try {
        await ipfsService.unpinFile(evidence.ipfsCid);
      } catch (ipfsError) {
        console.warn(`[IPFS Cleanup] Pinata unpin failed for ${evidence.ipfsCid}:`, ipfsError.message);
      }
    }

    // 3. Delete from database (relation cascade will remove custodyEvents)
    await prisma.evidence.delete({
      where: { id },
    });

    // 4. Log in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: userEmail,
        action: "Destroy Evidence",
        status: "Success",
        evidenceId: id,
        detail: `Evidence record ${id} (file hash ${evidence.fileHash}) was completely purged from database and unpinned from IPFS.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    res.json({ success: true, message: `Evidence record ${id} successfully destroyed` });
  } catch (error) {
    console.error("Destroy evidence error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = router;
