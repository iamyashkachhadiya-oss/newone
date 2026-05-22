/**
 * server.js — Standalone Groq API backend for FabricaAI
 *
 * Run:  node server.js
 * POST: http://localhost:4000/chat  { "message": "..." }
 *
 * Requires: npm install express groq-sdk dotenv
 * API key:  set GROQ_API_KEY in key.env (or .env)
 */

import dotenv from 'dotenv'
import express from 'express'
import Groq from 'groq-sdk'

// ── Load env vars (supports both .env and key.env) ────────────────────────────
dotenv.config({ path: '.env' })
dotenv.config({ path: 'key.env' })   // fallback — won't override already-set keys

const PORT = process.env.PORT || 4000

// ── Groq client ───────────────────────────────────────────────────────────────
const apiKey = process.env.GROQ_API_KEY
if (!apiKey) {
  console.error('❌  GROQ_API_KEY is missing. Add it to key.env or .env')
  process.exit(1)
}
const groq = new Groq({ apiKey })

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are FabricaAI, a professional textile design assistant specialised in weave structures, yarn systems, sari design, dobby/jacquard programming, and fabric engineering.

When the user describes a design idea, motif, or pattern, convert their input into structured JSON with the following shape:

{
  "motif": "<what the primary design element or motif is>",
  "placement": "<where it sits on the fabric: body | border | pallu | allover>",
  "repeat_pattern": "<type of repeat: brick | straight | half-drop | mirror | random>",
  "color_palette": ["<color1>", "<color2>"],
  "weave_type": "<plain | twill | satin | dobby | jacquard | other>",
  "notes": "<any special construction, yarn, or weave notes>"
}

Rules:
- Return ONLY valid JSON — no markdown, no prose, no code fences.
- If the user asks a general question instead of describing a design, reply with helpful plain text inside a JSON "answer" key: { "answer": "..." }
- Be concise and textile-industry accurate.`

// ── Express app ───────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

// Allow requests from the Next.js dev server (simple CORS)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.sendStatus(200); return }
  next()
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'FabricaAI Groq Backend' })
})

// ── POST /chat ────────────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const userMessage = req.body?.message?.trim()

  if (!userMessage) {
    return res.status(400).json({ error: '"message" field is required and must not be empty.' })
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 512,
    })

    const rawText = completion.choices[0]?.message?.content ?? ''

    // Attempt to parse as JSON; wrap in { answer } otherwise
    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      parsed = { answer: rawText }
    }

    return res.status(200).json({ result: parsed })

  } catch (err) {
    console.error('[/chat] Groq API error:', err?.message ?? err)
    return res.status(500).json({ error: 'Failed to reach Groq API. Please try again.' })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  FabricaAI backend running → http://localhost:${PORT}`)
})
