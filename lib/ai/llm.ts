// =============================================
// LLM Module - Google Gemini (Free API)
// Fallback: Groq (also free)
// =============================================

import { ResearchResult } from '@/types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// =============================================
// PROMPT ENGINEERING
// =============================================
function buildResearchPrompt(query: string, context: string): string {
  return `You are an expert research analyst AI. Your job is to analyze the provided document context and generate a structured research report.

CRITICAL RULES:
1. ONLY use information from the provided CONTEXT below
2. Do NOT hallucinate or add information not in the context
3. If the context doesn't contain enough information, say so in the summary
4. Always cite specific parts of the context
5. Return ONLY valid JSON — no markdown, no extra text

CONTEXT FROM DOCUMENTS:
---
${context}
---

RESEARCH QUERY: ${query}

Generate a comprehensive research report. Return ONLY this JSON structure (no backticks, no markdown):
{
  "topic": "Main topic of the research query in 5-10 words",
  "summary": "A comprehensive 3-5 sentence summary directly answering the query based on context",
  "key_points": [
    "Specific key point 1 from the context",
    "Specific key point 2 from the context",
    "Specific key point 3 from the context",
    "Add more if relevant"
  ],
  "insights": [
    "A deeper analytical insight derived from the context",
    "Another insight connecting different parts of the context"
  ],
  "citations": [
    {
      "text": "Direct or paraphrased quote from context",
      "source": "Document section or location",
      "relevance_score": 0.95
    }
  ],
  "confidence_score": 0.85,
  "methodology": "How you analyzed the context to answer this query",
  "limitations": "What the context doesn't cover or gaps in answering the query"
}`
}

// =============================================
// GEMINI API CALL
// =============================================
async function callGemini(
  prompt: string,
  model: string = 'gemini-1.5-flash'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,        // Low for factual, structured output
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json', // Force JSON response
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        ],
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')
  return text
}

// =============================================
// GROQ FALLBACK
// =============================================
async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a research analyst. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// =============================================
// MAIN: Generate Research Report
// =============================================
export async function generateResearchReport(
  query: string,
  contextChunks: string[],
  plan: 'free' | 'premium' = 'free'
): Promise<{ result: ResearchResult; model: string }> {
  
  const context = contextChunks
    .map((chunk, i) => `[Chunk ${i + 1}]\n${chunk}`)
    .join('\n\n')
  
  const prompt = buildResearchPrompt(query, context)
  
  // Premium gets Gemini Pro, free gets Flash
  const geminiModel = plan === 'premium' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'
  
  let rawResponse: string
  let modelUsed: string

  try {
    rawResponse = await callGemini(prompt, geminiModel)
    modelUsed = geminiModel
  } catch (geminiError) {
    console.warn('Gemini failed, trying Groq fallback:', geminiError)
    try {
      rawResponse = await callGroq(prompt)
      modelUsed = 'llama-3.1-8b-instant'
    } catch (groqError) {
      throw new Error(`Both LLMs failed. Gemini: ${geminiError}. Groq: ${groqError}`)
    }
  }

  // Parse and validate JSON
  const cleanJson = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  let result: ResearchResult
  try {
    result = JSON.parse(cleanJson)
  } catch {
    throw new Error(`LLM returned invalid JSON: ${cleanJson.substring(0, 200)}`)
  }

  // Validate required fields
  if (!result.topic || !result.summary) {
    throw new Error('LLM response missing required fields')
  }

  // Ensure confidence_score is a number between 0 and 1
  result.confidence_score = Math.min(
    1,
    Math.max(0, Number(result.confidence_score) || 0.7)
  )

  // Ensure arrays are actually arrays
  result.key_points = Array.isArray(result.key_points) ? result.key_points : []
  result.insights = Array.isArray(result.insights) ? result.insights : []
  result.citations = Array.isArray(result.citations) ? result.citations : []

  return { result, model: modelUsed }
}
