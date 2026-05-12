// =============================================
// Embeddings Module - Uses HuggingFace Free API
// Model: sentence-transformers/all-MiniLM-L6-v2
// Output: 384-dimensional vectors
// =============================================

const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HuggingFace API error: ${error}`)
  }

  const result = await response.json()
  
  // HF returns array of arrays for batches, or flat array for single
  if (Array.isArray(result[0])) {
    return result[0] as number[]
  }
  return result as number[]
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10
  const embeddings: number[][] = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: batch,
        options: { wait_for_model: true },
      }),
    })

    if (!response.ok) {
      throw new Error(`HuggingFace batch error: ${response.statusText}`)
    }

    const result = await response.json()
    embeddings.push(...result)
    
    // Small delay to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return embeddings
}
