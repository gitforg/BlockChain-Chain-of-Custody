const crypto = require("crypto");

/**
 * Calculates the SHA-256 hash of a file buffer or content
 * @param {Buffer} buffer - File buffer
 * @returns {string} - Hex string prefixed with 0x (matching smart contract expectation)
 */
function calculateSha256(buffer) {
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return "0x" + hash.digest("hex");
}

module.exports = {
  calculateSha256,
};
