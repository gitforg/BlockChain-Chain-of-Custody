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

// 3. Register New Evidence (Multer upload)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Evidence file payload is required" });
    }

    const {
      title,
      caseId,
      classification = "Restricted",
      notes = "",
      custodian = "Officer Robert Vance",
      location = "Intake Vault Room",
      department = "Intake Division",
      type,
    } = req.body;

    const userEmail = req.headers["x-user-email"] || "officer@evidencechain.com";

    // 1. Generate SHA-256 hash of file
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = hashService.calculateSha256(fileBuffer);

    // 2. Generate sequential Evidence ID (EV-YYYY-NNNN)
    const year = new Date().getFullYear();
    const count = await prisma.evidence.count();
    const nextSeq = String(count + 1).padStart(4, "0");
    const evidenceId = `EV-${year}-${nextSeq}`;

    // 3. Upload file to Pinata IPFS service
    let ipfsResult;
    try {
      ipfsResult = await ipfsService.uploadFile(file.path, file.originalname);
    } catch (ipfsError) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Failed to upload evidence payload to IPFS storage: ${ipfsError.message}`);
    }

    // 4. Execute blockchain transaction with real CID
    let txDetails;
    try {
      txDetails = await blockchainService.registerEvidence(
        evidenceId,
        caseId,
        fileHash,
        ipfsResult.ipfsCid
      );
    } catch (blockchainError) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Failed to anchor evidence registry transaction on-chain: ${blockchainError.message}`);
    }

    // 5. Store metadata in PostgreSQL
    const evidence = await prisma.evidence.create({
      data: {
        id: evidenceId,
        title,
        caseId,
        type: type || file.mimetype || "Binary File",
        classification,
        notes,
        custodian,
        location,
        department,
        status: "Registered",
        fileHash,
        ipfsCid: ipfsResult.ipfsCid,
        filePath: ipfsResult.gatewayUrl,
        fileName: file.originalname,
        fileSize: file.size,
        txHash: txDetails.txHash,
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
        confirmation: `Confirmed Block #${txDetails.blockNumber}`,
        txHash: txDetails.txHash,
      },
    });

    // 7. Log in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: userEmail,
        action: "Register Evidence",
        status: "Success",
        evidenceId,
        txHash: txDetails.txHash,
        detail: `Evidence ${evidenceId} registered with file hash ${fileHash} and IPFS CID ${ipfsResult.ipfsCid} for Case ${caseId}.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    // 8. Delete temporary local file upload
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(201).json(evidence);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Temp file cleanup failed:", err);
      }
    }
    console.error("Register evidence error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 4. Transfer Custody
router.post("/:id/transfer", async (req, res) => {
  try {
    const { id } = req.params;
    const { newCustodian, department, reason, action } = req.body;
    const userEmail = req.headers["x-user-email"] || "officer@evidencechain.com";

    // 1. Fetch evidence
    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      return res.status(404).json({ error: "Evidence record not found" });
    }

    // Determine status progression based on department roles
    let newStatus = "InTransit";
    let numericStatus = 1; // InTransit in solidity
    
    if (department.toLowerCase().includes("laboratory") || department.toLowerCase().includes("forensic")) {
      newStatus = "InLab";
      numericStatus = 2;
    } else if (department.toLowerCase().includes("court")) {
      newStatus = "InCourt";
      numericStatus = 3;
    } else if (department.toLowerCase().includes("archive") || department.toLowerCase().includes("records")) {
      newStatus = "Disposed";
      numericStatus = 4;
    }

    // 2. Perform blockchain transfer & status updates
    const prevCustodian = evidence.custodian;
    const simRecipientWallet = "0x" + Math.random().toString(16).slice(2, 42); // simulated address
    
    const txDetails = await blockchainService.transferCustody(
      id,
      simRecipientWallet,
      action || "CUSTODY_HANDOVER"
    );

    // Call update status on chain if status changed
    let statusTxHash = txDetails.txHash;
    if (newStatus !== evidence.status) {
      const statusTx = await blockchainService.updateStatus(id, numericStatus);
      statusTxHash = statusTx.txHash;
    }

    // 3. Update PostgreSQL
    const updated = await prisma.evidence.update({
      where: { id },
      data: {
        custodian: newCustodian,
        department,
        status: newStatus,
        txHash: statusTxHash,
      },
    });

    // 4. Create Custody Handoff Event
    await prisma.custodyEvent.create({
      data: {
        evidenceId: id,
        actor: newCustodian,
        department,
        action: action || `Accepted Custody Handoff & Logged Intake`,
        status: newStatus,
        note: reason || `Custody handoff completed from ${prevCustodian}.`,
        hash: evidence.fileHash,
        confirmation: `Confirmed Block #${txDetails.blockNumber}`,
        txHash: statusTxHash,
      },
    });

    // 5. Log in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: userEmail,
        action: "Transfer Custody",
        status: "Success",
        evidenceId: id,
        txHash: statusTxHash,
        detail: `Handoff complete. Custody transferred from ${prevCustodian} to ${newCustodian}.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Transfer custody error:", error.message);
    res.status(500).json({ error: "Internal server error" });
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
