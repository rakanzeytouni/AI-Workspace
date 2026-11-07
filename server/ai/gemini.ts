import "@langchain/community";
import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY?.trim();

if (!apiKey) {
  throw new Error("GROQ_API_KEY is missing. Add it to server/.env and restart the backend.");
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function generateReply(
  prompt: string,
  options?: { model?: string; systemPrompt?: string }
) {
  const completion = await client.chat.completions.create({
    model: options?.model || "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          options?.systemPrompt || `You are a helpful, smart, and friendly AI assistant.

CRITICAL BEHAVIOR RULES:
1. ACT NATURALLY: If the user says hello, greets you, or wants to chat, respond warmly and conversationally (e.g., "Hello! How can I help you today?").
2. NEVER MENTION "CONTEXT": Do not use phrases like "Based on the context provided," "The context does not contain," or "In the provided files." The user does not want to hear about the system mechanics.
3. USE GENERAL KNOWLEDGE: If the user asks a factual question (like "What is the tallest mountain?") and the information is not in the invisible context I provide, just answer the question directly using your own vast knowledge. 
4. SEAMLESS INTEGRATION: If the context has the answer, use it to answer the user naturally, as if you just knew it.`
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? "";
}