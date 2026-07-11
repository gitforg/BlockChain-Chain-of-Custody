const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { actor, action, status, evidenceId } = req.query;

    const where = {};
    if (actor) {
      where.actor = { contains: actor, mode: "insensitive" };
    }
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (status) {
      where.status = { contains: status, mode: "insensitive" };
    }
    if (evidenceId) {
      where.evidenceId = { contains: evidenceId, mode: "insensitive" };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { time: "desc" },
    });

    res.json(logs);
  } catch (error) {
    console.error("Audit API error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
