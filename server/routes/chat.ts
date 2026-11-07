import "@langchain/community";
import { Router } from "express";
import { generateReply } from "../ai/gemini";
import { retrieveContext } from "../rag/retrieve";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message, prompt } = req.body;
    const userInput = typeof message === "string" ? message : typeof prompt === "string" ? prompt : "";

    if (!userInput) {
      return res.status(400).json({ error: "Please provide a message or prompt." });
    }

    const context = await retrieveContext(userInput);

    const finalPrompt = `
Use the context below to answer the user question.

Context:
${context}

Question:
${userInput}
`;

    let reply: string;
    try {
      reply = await generateReply(finalPrompt, {
        systemPrompt:
          "You are a helpful assistant. Answer using the provided context and be concise.",
      });
    } catch (err) {
      console.error("Groq API request failed:", err);
      return res.status(502).json({
        error: `Groq API request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }

    return res.json({ reply });
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;