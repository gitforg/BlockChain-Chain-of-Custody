const fs = require("fs");
const path = require("path");

class IpfsService {
  constructor() {
    this.jwt = process.env.PINATA_JWT;
    this.gatewayUrl = process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
  }

  /**
   * Uploads a file on the local disk to Pinata IPFS.
   * Falls back to a mock CID if PINATA_JWT is not set (for development offline capability).
   * @param {string} filePath - Absolute path to the file on disk
   * @param {string} originalName - Name of the file uploaded by the user
   * @returns {Promise<{ipfsCid: string, pinSize: number, timestamp: string, gatewayUrl: string}>}
   */
  async uploadFile(filePath, originalName) {
    if (!this.jwt || this.jwt.trim() === "") {
      console.warn("[IPFS Service] PINATA_JWT is not configured. Falling back to simulated IPFS CID.");
      const mockCid = "Qm" + Math.random().toString(36).slice(2, 12) + "EvidenceSimCid55db2f";
      return {
        ipfsCid: mockCid,
        pinSize: 1024,
        timestamp: new Date().toISOString(),
        gatewayUrl: `${this.gatewayUrl}${mockCid}`
      };
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      const formData = new FormData();
      formData.append("file", blob, originalName);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return {
        ipfsCid: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        gatewayUrl: `${this.gatewayUrl}${result.IpfsHash}`
      };
    } catch (error) {
      console.error("[IPFS Service] Error uploading to Pinata:", error.message);
      throw error;
    }
  }

  /**
   * Unpins a file from Pinata using its IPFS CID.
   * If PINATA_JWT is not configured, logs a warning and returns success.
   * @param {string} cid - IPFS CID Hash
   * @returns {Promise<boolean>}
   */
  async unpinFile(cid) {
    if (!this.jwt || this.jwt.trim() === "") {
      console.warn("[IPFS Service] PINATA_JWT is not configured. Simulating IPFS unpin.");
      return true;
    }

    try {
      const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.jwt}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata unpin failed with status ${response.status}: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error("[IPFS Service] Error unpinning from Pinata:", error.message);
      throw error;
    }
  }

  /**
   * Generates public gateway URL for a CID
   * @param {string} cid - IPFS CID Hash
   * @returns {string}
   */
  getGatewayUrl(cid) {
    return `${this.gatewayUrl}${cid}`;
  }
}

module.exports = new IpfsService();
