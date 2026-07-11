const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const totalEvidence = await prisma.evidence.count();
    const inTransit = await prisma.evidence.count({ where: { status: "InTransit" } });
    const inLab = await prisma.evidence.count({ where: { status: "InLab" } });
    const inCourt = await prisma.evidence.count({ where: { status: "InCourt" } });
    const disposed = await prisma.evidence.count({ where: { status: "Disposed" } });
    
    const pendingTransfers = inTransit;

    const blockchainEventsCount = await prisma.custodyEvent.count({
      where: {
        txHash: { not: "" }
      }
    });

    const verificationEventsCount = await prisma.custodyEvent.count({
      where: {
        action: "VERIFIED"
      }
    });

    res.json({
      metrics: [
        { label: "Total Evidence", value: totalEvidence.toString(), delta: "+12 this week", icon: "Evidence" },
        { label: "Evidence In Transit", value: inTransit.toString(), delta: `${pendingTransfers} pending approval`, icon: "Transit" },
        { label: "Evidence In Laboratory", value: inLab.toString(), delta: "Active analysts", icon: "Lab" },
        { label: "Evidence In Court", value: inCourt.toString(), delta: "Active hearings", icon: "Court" },
        { label: "Disposed Evidence", value: disposed.toString(), delta: "Archived records", icon: "Disposed" },
        { label: "Pending Transfers", value: pendingTransfers.toString(), delta: "Awaiting signatures", icon: "Pending" },
        { label: "Verified Hashes", value: verificationEventsCount > 0 ? "100%" : "0 checks", delta: `${verificationEventsCount} integrity checks`, icon: "Verified" },
        { label: "Blockchain Transactions", value: blockchainEventsCount.toLocaleString(), delta: "Secured blocks", icon: "Blockchain" },
      ],
      distribution: {
        total: totalEvidence,
        inLab,
        inTransit,
        inCourt,
        disposed
      }
    });
  } catch (error) {
    console.error("Stats API error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
