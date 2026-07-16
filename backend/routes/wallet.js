const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function deriveUsername(email) {
  return email.split("@")[0].replace(/[^a-z0-9._-]/gi, "_");
}

router.get("/me", async (req, res) => {
  try {
    const email = req.headers["x-user-email"];
    if (!email) {
      return res.status(400).json({ error: "Missing user email" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    return res.json({ walletAddress: user?.walletAddress || "" });
  } catch (error) {
    console.error("Wallet lookup error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/link", async (req, res) => {
  try {
    const email = req.headers["x-user-email"];
    const { walletAddress } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Missing user email" });
    }
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing && existing.walletAddress && existing.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(409).json({ error: "This user is already linked to another wallet" });
    }

    const updated = await prisma.user.upsert({
      where: { email },
      update: {
        walletAddress,
      },
      create: {
        username: deriveUsername(email),
        email,
        role: "Officer",
        walletAddress,
      },
    });

    return res.json({ walletAddress: updated.walletAddress });
  } catch (error) {
    console.error("Wallet link error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
