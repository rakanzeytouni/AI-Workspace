import "@langchain/community";
import { embedTexts } from "./embeddings";
import { searchByEmbedding } from "./vector";
import fs from "fs";
import path from "path";

async function getUploadedTextContext(): Promise<string> {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) return "";

  const files = fs.readdirSync(uploadsDir).filter((f) => f.endsWith(".txt"));
  const texts = files.map((f) => {
    try {
      return fs.readFileSync(path.join(uploadsDir, f), "utf-8");
    } catch (e) {
      console.error("Failed to read uploaded text file:", e);
      return "";
    }
  });

  return texts.filter(Boolean).join("\n\n");
}

export async function retrieveContext(query: string) {
  try {
    const qEmb = (await embedTexts([query]))[0];

    if (qEmb && qEmb.length > 0) {
      const results = searchByEmbedding(qEmb, 5);
      if (results && results.length > 0) {
        return results.map((r) => r.text).join("\n\n");
      }
    }

    return await getUploadedTextContext();
  } catch (err) {
    console.error("retrieveContext error:", err);
    return await getUploadedTextContext();
  }
}

export default retrieveContext;