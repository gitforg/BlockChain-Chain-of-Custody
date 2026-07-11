const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves file metadata and returns standard details.
 * Currently stores files locally, can be swapped for Firebase Storage later.
 */
class StorageService {
  /**
   * Save an uploaded file (abstracted)
   * In a real Firebase migration, this would upload the buffer to Firebase Storage.
   * Currently, multer has already written the file to the local directory.
   * @param {object} file - Express multer file object
   * @returns {Promise<object>} - Saved file details (path, fileName, size)
   */
  async saveFile(file) {
    const fileName = file.filename || file.originalname;
    const filePath = file.path || path.join(UPLOADS_DIR, fileName);
    const relativePath = path.relative(path.join(__dirname, ".."), filePath).replace(/\\/g, "/");

    return {
      filePath: relativePath,
      fileName: file.originalname,
      fileSize: file.size,
    };
  }

  /**
   * Delete a file
   * @param {string} relativePath - File path relative to backend root
   */
  async deleteFile(relativePath) {
    const fullPath = path.join(__dirname, "..", relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

module.exports = new StorageService();
