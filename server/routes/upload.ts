import "@langchain/community";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pdfParse from "pdf-parse";

const router = express.Router();

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// POST /api/upload
router.post("/", (req, res) => {
  upload.single("file")(req as any, res as any, async (err: any) => {
    if (err) {
      // Multer error
      const msg = err.message || "Upload error";
      return res.status(400).json({ success: false, message: msg });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = file.path;
    let extractedText: string = "";

    try {
      if (file.mimetype === "application/pdf") {
        const buffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(buffer as Buffer);
        extractedText = parsed?.text ?? "";

        // Save extracted text alongside the uploaded file
        const txtPath = path.join(uploadDir, file.filename + ".txt");
        fs.writeFileSync(txtPath, extractedText, "utf-8");

        // Build chunks and upsert to local vector DB (if embeddings available)
        try {
          const { splitText } = await import("../rag/splitter.js");
          const { embedTexts } = await import("../rag/embeddings.js");
          const { upsertDocumentChunks } = await import("../rag/vector.js");

          const chunks = splitText(extractedText, 1000, 200);
          const embeddings = await embedTexts(chunks);
          await upsertDocumentChunks(file.filename, chunks, embeddings);
        } catch (e) {
          console.error("RAG upsert failed:", e);
        }
      }
    } catch (e) {
      console.error("PDF parse failed:", e);
      return res.status(500).json({ success: false, message: "Failed to extract PDF text" });
    }

    return res.json({
      success: true,
      message: "PDF uploaded successfully",
      file: {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
      },
      textExtracted: extractedText.length > 0,
    });
  });
});

export default router;