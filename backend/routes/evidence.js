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
          { id: { contains: cleanSearch, mode: "insensitive" } },
          { caseId: { contains: cleanSearch, mode: "insensitive" } },
          { title: { contains: cleanSearch, mode: "insensitive" } },
          { type: { contains: cleanSearch, mode: "insensitive" } },
          { custodian: { contains: cleanSearch, mode: "insensitive" } },
          { notes: { contains: cleanSearch, mode: "insensitive" } },
          { txHash: { contains: cleanSearch, mode: "insensitive" } },
        ],
      });
    }

    // Filters
    if (status !== "all") {
      where.AND.push({ status: { equals: status, mode: "insensitive" } });
    }
    if (classification !== "all") {
      where.AND.push({ classification: { equals: classification, mode: "insensitive" } });
    }
    if (custodian !== "all") {
      where.AND.push({ custodian: { contains: custodian, mode: "insensitive" } });
    }
    if (caseId.trim()) {
      where.AND.push({ caseId: { contains: caseId.trim(), mode: "insensitive" } });
    }
    if (department.trim()) {
      where.AND.push({ department: { contains: department.trim(), mode: "insensitive" } });
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

    // 3. Save to local storage service
    const fileDetails = await storageService.saveFile(file);

    // 4. Simulate or execute blockchain transaction
    const mockCid = "Qm" + fileHash.slice(10, 56);
    const txDetails = await blockchainService.registerEvidence(
      evidenceId,
      caseId,
      fileHash,
      mockCid
    );

    // 5. Store metadata in PostgreSQL using Prisma
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
        ipfsCid: mockCid,
        filePath: fileDetails.filePath,
        fileName: fileDetails.fileName,
        fileSize: fileDetails.fileSize,
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
        detail: `Evidence ${evidenceId} registered with file hash ${fileHash} for Case ${caseId}.`,
        ipAddress: req.ip || "127.0.0.1",
      },
    });

    res.status(201).json(evidence);
  } catch (error) {
    console.error("Register evidence error:", error.message);
    res.status(500).json({ error: "Internal server error" });
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
    await storageService.deleteFile(
      path.relative(path.join(__dirname, ".."), file.path).replace(/\\/g, "/")
    );

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
        where: { fileHash: { equals: calculatedHash, mode: "insensitive" } },
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
    console.error("Verification API error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
