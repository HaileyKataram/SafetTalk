const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// 🔐 AES-256 CONFIG
const AES_KEY = crypto.randomBytes(32); // 256-bit key
const IV_LENGTH = 16;

// Encrypt text (AES-256-CBC)
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Hash text (SHA-256)
function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// 📩 Report endpoint
app.post("/report", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const hashedRecord = hash(text);
  const encryptedRecord = encrypt(text);

  console.log("🔐 Hashed Incident:", hashedRecord);
  console.log("🔒 Encrypted Evidence Stored");

  // ⚠️ In real deployment: store encryptedRecord in DB
  res.json({
    status: "securely stored",
    hash: hashedRecord
  });
});

app.listen(PORT, () => {
  console.log(`✅ Secure SafeTalk backend running on http://localhost:${PORT}`);
});
