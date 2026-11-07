let pipeline: any;

async function getPipeline() {
  if (!pipeline) {
    const transformers = await import("@xenova/transformers");
    pipeline = transformers.pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return pipeline;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts?.length) return [];

  const model = await getPipeline();
  const vectors: number[][] = [];

  for (const text of texts) {
    const output = await model(text, {
      pooling: "mean",
      normalize: true,
    });

    vectors.push(Array.from(output.data));
  }

  return vectors;
}

export default embedTexts;