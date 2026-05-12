// =============================================
// Text Chunking Module
// Splits documents into overlapping chunks
// for better context preservation in RAG
// =============================================

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

const CHUNK_SIZE = 600;       // target tokens per chunk
const CHUNK_OVERLAP = 100;    // overlap tokens between chunks
const AVG_CHARS_PER_TOKEN = 4; // rough estimate

function estimateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
}

function splitIntoSentences(text: string): string[] {
  // Split by sentence boundaries
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 10) // skip very short fragments
}

export function chunkText(text: string): TextChunk[] {
  // Clean up the text
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim()

  const sentences = splitIntoSentences(cleaned)
  const chunks: TextChunk[] = []
  
  let currentChunk: string[] = []
  let currentTokens = 0
  let chunkIndex = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const sentenceTokens = estimateTokens(sentence)

    // If adding this sentence exceeds chunk size, save current chunk
    if (currentTokens + sentenceTokens > CHUNK_SIZE && currentChunk.length > 0) {
      const content = currentChunk.join(' ').trim()
      if (content.length > 50) { // only save meaningful chunks
        chunks.push({
          content,
          index: chunkIndex++,
          tokenCount: currentTokens,
        })
      }

      // Start new chunk with overlap (keep last few sentences)
      const overlapSentences: string[] = []
      let overlapTokens = 0
      
      for (let j = currentChunk.length - 1; j >= 0; j--) {
        const s = currentChunk[j]
        const t = estimateTokens(s)
        if (overlapTokens + t > CHUNK_OVERLAP) break
        overlapSentences.unshift(s)
        overlapTokens += t
      }
      
      currentChunk = [...overlapSentences, sentence]
      currentTokens = overlapTokens + sentenceTokens
    } else {
      currentChunk.push(sentence)
      currentTokens += sentenceTokens
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const content = currentChunk.join(' ').trim()
    if (content.length > 50) {
      chunks.push({
        content,
        index: chunkIndex,
        tokenCount: currentTokens,
      })
    }
  }

  return chunks
}
