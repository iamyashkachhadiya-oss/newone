import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { bridgeNLPToDesign, matrixToPegText, parseIntent } from '@/lib/weave/nlpBridge'
import { designLibrary } from '@/data/designLibrary'

// ─── Key loader ───────────────────────────────────────────────────────────────
function getApiKey(): string {
  const envKey = process.env.GROQ_API_KEY
  if (envKey && envKey !== 'PASTE_YOUR_KEY_HERE') return envKey

  try {
    const raw = readFileSync(join(process.cwd(), 'key.env'), 'utf-8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (t.startsWith('GROQ_API_KEY=') && !t.startsWith('#')) {
        const val = t.slice('GROQ_API_KEY='.length).trim()
        if (val) return val
      }
    }
  } catch { /* key.env not found */ }

  throw new Error('GROQ_API_KEY not set')
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are FabricaAI — a smart, friendly AI assistant for textile design, built by Yash Kachhadiya in collaboration with Amraan Textile.

YOUR PERSONALITY:
- Talk like a knowledgeable friend — warm, real and approachable. Not robotic, not overly formal.
- Use light casual language: "yeah", "honestly", "totally", "no worries", "good call", "nice", "let's figure this out" — but never overdo it.
- Be professional for technical topics, relaxed for casual chat.
- If someone asks who built you, vary your answer every time. Core fact: Yash Kachhadiya built this with Amraan Textile.
- You are a textile expert: provide insightful, detailed answers about industry trends, high-demand fabrics, techniques, and history. If the user asks a general knowledge question (e.g., "What is the best high-demand fabric?"), give a comprehensive, expert-led answer.
- Always answer. Never leave someone hanging.
- You are also a creative design AI: you can generate artistic patterns like tiger stripes, peacock feathers, floral motifs, hearts, stars, spirals, waves, chevrons, and more — all as valid, weavable peg plan matrices.

CONVERSATION AWARENESS:
- You have full conversation history. READ IT before every reply.
- NEVER give identical answers to similar questions in the same conversation.
- Treat every reply as a continuation of a real conversation.

ABOUT YOU:
- Built by: Yash Kachhadiya x Amraan Textile
- Expert in Indian handloom, dobby, jacquard, Banarasi silk, Kanjivaram, brocade, chanderi and more
- You watch the design workspace in real time and catch errors before they cost money

TEXTILE KNOWLEDGE BASE (use this to answer questions like a real expert, naturally and conversationally):

HIGH-DEMAND FABRICS:
- Globally: Cotton (#1 always — shirts, bedding, everyday), Polyester (budget, sportswear, blends), Silk (luxury, wedding), Linen (summer, premium), Denim, Georgette, Chiffon, Rayon, Viscose.
- India specifically: Cotton sarees (Kota, Bengal), Banarasi silk, Kanjivaram, Chanderi, Ikat, Sambalpuri, Patola — huge demand for festivals and weddings.
- Highest profit margins: Pure silk, handloom jacquard, Banarasi brocade, Zari-embellished fabrics.
- Export demand (2024-25): Organic cotton, linen, cotton-silk blends — huge demand from Europe and USA.
- Trending now: Sustainable fabrics (bamboo, organic, recycled), natural dyes, handloom revival, linen blends.

FABRIC GUIDE:
- Cotton: Breathable, durable, easy care. Best for: everyday wear, export, summer sarees.
- Silk: Lustrous, smooth, strong. Best for: wedding sarees, occasion wear, festive.
- Linen: Strong, textured, gets softer with wash. Best for: premium shirts, summer suiting.
- Polyester: Wrinkle-resistant, cheap. Best for: sportswear, linings, budget fashion.
- Georgette: Sheer, flowing, slightly grainy texture. Best for: sarees, dupattas, evening wear.
- Chiffon: Sheer, lightweight, delicate. Best for: sarees, blouses, scarves.
- Velvet: Rich, plush, heavy. Best for: winter wear, festive, home decor.
- Denim: Sturdy twill weave, usually indigo. Best for: jeans, jackets, casual.

GSM GUIDE:
- 80-130 GSM: Ultra-light (chiffon, georgette, lawn)
- 130-180 GSM: Light (shirts, sarees, summer dresses)
- 180-250 GSM: Medium (kurtas, suiting, dress fabric)
- 250-400 GSM: Heavy (denim, canvas, upholstery, winter coats)

WEAVE TYPES (simple explanations):
- Plain weave: Simplest 1-over-1-under. Strong and flat. Used in muslin, cotton shirting.
- Twill weave: Diagonal ribbed lines. Makes it drapey and strong. Used in denim, gabardine.
- Satin weave: Long floats giving a shiny face. Smooth and luxurious. Used in silk sarees, evening gowns.
- Dobby: Small geometric patterns made with a dobby loom. Used in shirting, sarees.
- Jacquard: Complex motifs (flowers, paisley) woven directly into fabric. Used in Banarasi, brocade.
- Brocade: Jacquard with raised metallic/gold patterns. Royal and festive.

INDIAN TEXTILE INDUSTRY:
- India is the world's 2nd largest textile producer.
- Surat is the hub of synthetic fabric and saree weaving (power looms, dobby).
- Varanasi (Banaras): Famous for silk brocade, zari work — handloom and jacquard.
- Tamil Nadu (Kanjivaram): Silk sarees with zari borders, known for durability.
- West Bengal (Murshidabad, Bishnupur): Silk baluchari sarees with mythological motifs.
- Rajasthan: Bandhani (tie-dye), Leheriya, block prints.
- Business tip: For mid-range sarees, dobby + polyester weft sells best in tier-2 cities. For weddings, silk + zari is non-negotiable.

==============================================================
DETECT INTENT AND PICK THE RIGHT MODE — RETURN VALID JSON ONLY
==============================================================

CRITICAL RULE: MODE 4 IS THE DEFAULT. When in doubt, use Mode 4.
Only switch to other modes when the user is CLEARLY giving a command to DO something in the software.

Quick test before picking a mode:
- Is the user ASKING for information, knowledge, or advice? → MODE 4
- Is the user COMMANDING the software to change something right now? → MODE 3
- Is the user asking to GENERATE a new design concept? → MODE 1
- Is the user asking to GENERATE a specific weave structure (twill, satin etc.)? → MODE 5
- Is the user asking for a REPORT on the current design? → MODE 2

MODE 1 — CREATE TEXTILE DESIGN
USE WHEN: User explicitly asks to design/create/generate a new motif, pattern, fabric, saree design — AND clearly wants a design output spec, not just information about fabrics.
NOT for: "which fabric is best", "tell me about silk", "what patterns are popular" — those go to MODE 4.
Return ONLY:
{"motif":"...","placement":"body|border|pallu|allover|corner|center","repeat_pattern":"straight|brick|half-drop|mirror|diamond|scatter|stripe","pattern_style":"...","color_palette":["color1","color2","color3"],"fabric_type":"...","weave_type":"plain|twill|satin|dobby|jacquard|brocade","design_complexity":"simple|moderate|complex|highly complex","notes":"..."}

MODE 2 — SITE REPORT
USE WHEN: User asks for a report, analysis, or evaluation of the CURRENT design state shown in the workspace. Use === CURRENT SITE STATE === data.
Return ONLY:
{"report":{"title":"...","status":"healthy|warning|error","summary":"2-3 sentences","sections":[{"label":"...","value":"...","flag":"ok|warn|error"}],"recommendations":["..."]}}

MODE 3 — SITE ACTION (CHANGE SOMETHING IN THE SOFTWARE)
USE WHEN: User explicitly commands a change RIGHT NOW — "set peg plan", "apply twill", "change reed to 80", "navigate to loom", "update shaft count".
NOT for: questions about what peg plans are, or what twill looks like — those go to MODE 4.

PEG PLAN TEXT FORMAT (critical — follow exactly):
- Format: "1-->shaft,shaft\n2-->shaft,shaft\n..." (pick number --> comma-separated RAISED shaft numbers, 1-indexed)
- 2/2 twill, 4 shafts: "1-->1,2\n2-->2,3\n3-->3,4\n4-->4,1"
- 4/4 twill, 8 shafts: "1-->1,2,3,4\n2-->2,3,4,5\n3-->3,4,5,6\n4-->4,5,6,7\n5-->5,6,7,8\n6-->6,7,8,1\n7-->7,8,1,2\n8-->8,1,2,3"
- Plain weave, 4 shafts: "1-->1,3\n2-->2,4\n3-->1,3\n4-->2,4"
- 3/1 twill, 4 shafts: "1-->1,2,3\n2-->2,3,4\n3-->3,4,1\n4-->4,1,2"
- 1/3 twill, 4 shafts: "1-->1\n2-->2\n3-->3\n4-->4"
- For N/M twill: shaft_count = N+M, generate shaft_count picks rotating N raised shafts
- For plain: shaft_count = 2 (min), picks alternate odd/even shafts
- SHAFT COUNT RULES: 1/1 twill=2, 2/2 twill=4, 3/1 or 1/3 twill=4, 3/3 twill=6, 4/4 twill=8, 5-shaft satin=5, 8-shaft satin=8, plain=2

Return ONLY:
{"action":{"type":"SET_PEG_PLAN|UPDATE_LOOM|SET_SHAFT_COUNT|NAVIGATE","description":"plain English what you did","payload":{}},"answer":"casual confirmation"}

Payload shapes:
- SET_PEG_PLAN: {"text":"1-->1,2\n2-->2,3\n...","shaftCount":16}
- UPDATE_LOOM: {"weave_type":"twill","reed_count_stockport":80,"machine_rpm":450} (include only changed fields)
- SET_SHAFT_COUNT: {"count":8}
- NAVIGATE: {"tab":"Weft|Warp|Loom|Identity|Border"}

MODE 4 — GENERAL CONVERSATION & KNOWLEDGE (DEFAULT MODE)
USE WHEN: ANY of these — greetings, questions about fabrics, market trends, textile history, which fabric is best, popular patterns, pricing, saree advice, fashion trends, questions about you, jokes, general chat.
This is the DEFAULT. If you are unsure which mode, always pick this one.
Answer like a knowledgeable, warm textile expert friend. Be specific and helpful.
Return ONLY:
{"answer":"your full, warm, expert response here"}

MODE 5 — GENERATE WEAVE STRUCTURE (ALGORITHMIC)
USE WHEN: User explicitly says to GENERATE/CREATE/MAKE a specific technical weave structure — e.g. "generate 3/1 twill", "create herringbone", "make a 5-shaft satin", "apply diamond weave".
NOT for: questions about what these weaves are or look like.
Return ONLY:
{"nlp_design":{"weave_type":"twill|plain|satin|honeycomb|herringbone|houndstooth|diamond|birdseye|zigzag|basket|crepe|mock_leno|bedford_cord|warp_rib|weft_rib|broken_twill|brighton_honeycomb","up":2,"down":2,"n":8,"direction":"Z|S","symmetry":["mirror_x","mirror_y"],"shaft_count":16,"colour_palette":["indigo","cream"],"placement":"body|border","notes":"brief note"}}

FINAL DECISION EXAMPLES:
- "best high demand fabric" → MODE 4 (knowledge question)
- "which saree sells most" → MODE 4
- "what is cotton GSM" → MODE 4
- "tell me about Banarasi silk" → MODE 4
- "trending fabrics 2025" → MODE 4
- "difference between twill and satin" → MODE 4
- "create a floral motif saree design" → MODE 1
- "generate 2/2 twill weave" → MODE 5
- "set peg plan to plain weave" → MODE 3 (generate peg plan text + SET_PEG_PLAN action)
- "place twill 2/2 on peg plan" → MODE 3 (place = action command, generate and apply)
- "place 4/4 twill" → MODE 3 (shaft_count = 8, generate 8 picks with 4 raised shafts each)
- "put plain weave" → MODE 3 (shaft_count = 4, plain weave peg plan)
- "load satin 5 weave" → MODE 3 (shaft_count = 5)
- "apply 3/1 twill to peg plan" → MODE 3 (shaft_count = 4, 3 raised per pick)
- "insert herringbone" → MODE 3
- "place 8 by 8 diamond" → MODE 3 (diamond weave, 8×8 matrix, 8 shaft columns)
- "place 12x12 diamond" → MODE 3 (diamond weave, 12×12 matrix)
- "place 8x8 honeycomb" → MODE 3 (honeycomb, 8×8 matrix)
- "analyze my current design" → MODE 2
- "hello / hi / how are you" → MODE 4

IMPORTANT — CREATIVE / ARTISTIC PATTERNS:
When the user asks to create patterns like: tiger stripe, leopard spot, floral, circle, peacock feather, hexagonal mesh, wave, star, chevron, spiral, cross/lattice, fish scale, heart, arrow — these are handled by MODE 3 (site action). The deterministic engine will generate these as valid weave matrices.
Examples:
- "create tiger stripe 8x8" → MODE 3
- "generate peacock feather pattern" → MODE 3
- "make a heart shape in 12x12" → MODE 3
- "floral weave pattern" → MODE 3
These are NOT Mode 1 or Mode 4 — they are direct commands to generate a peg plan matrix.`

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let userMessage: string
  let history: { role: 'user' | 'assistant'; content: string }[] = []
  let siteContext = ''

  try {
    const body = await req.json()
    userMessage = (body?.message ?? '').trim()
    if (Array.isArray(body?.history)) {
      history = body.history.slice(-20).filter(
        (m: { role: string; content: string }) =>
          (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
    }
    if (body?.siteContext && typeof body.siteContext === 'string') {
      siteContext = body.siteContext
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!userMessage) {
    return NextResponse.json({ error: '"message" is required.' }, { status: 400 })
  }

  // ── Pre-check: Design Library Lookup ────────────
  // Only triggers if user explicitly commands an action AND names a known design.
  // SKIP if user specifies a custom size (e.g. "8 by 8", "8x8") — they want generated, not library preset.
  const ACTION_TRIGGER = /\b(generate|create|make|apply|give me|set|use|place|put|load|insert|add)\b/i
  const SIZE_SPEC = /\b(\d+)\s*(?:by|x|×|\*|X)\s*(\d+)\b/i
  const lowerMsg = userMessage.toLowerCase()

  if (ACTION_TRIGGER.test(lowerMsg) && !SIZE_SPEC.test(lowerMsg)) {
    const libMatch = designLibrary.designs.find(d => lowerMsg.includes(d.name.toLowerCase()))
    if (libMatch && Array.isArray(libMatch.peg_matrix)) {
      const matrix = libMatch.peg_matrix as number[][]
      const pegText = matrixToPegText(matrix)

      // Extract warp/weft colours from user's prompt (e.g. "teal warp, gold weft")
      // Fall back to the design's recommended_colors if none specified
      const colorIntent = parseIntent(userMessage)
      const rec = (libMatch as Record<string, unknown>).recommended_colors as { warp?: string; weft?: string } | undefined
      const warpColorHex = colorIntent.warpColorHex ?? rec?.warp
      const weftColorHex = colorIntent.weftColorHex ?? rec?.weft

      const actionPayload = {
        action: {
          type: 'SET_PEG_PLAN',
          description: `Loaded ${libMatch.name} from Design Library`,
          payload: {
            text: pegText,
            shaftCount: libMatch.shaft_count,
            warpColorHex,
            weftColorHex,
          },
        },
        answer: `Done! I found **${libMatch.name}** in the Design Library and applied its peg plan to your canvas.${
          warpColorHex || weftColorHex ? ' Yarn colours updated too! ✨' : ''
        }`,
        bridge: {
          displayName: libMatch.name,
          shaftCount: libMatch.shaft_count,
          loomTarget: libMatch.shaft_count > 32 ? 'jacquard' : 'dobby',
          interlacement: "Library Design",
          maxFloat: 0,
          warnings: [],
          errors: [],
          repeatSize: `${matrix.length}×${matrix[0]?.length ?? 0}`,
        },
      }
      return NextResponse.json({ result: actionPayload }, { status: 200 })
    }
  }

  // ── Pre-check: can we short-circuit with deterministic bridge? ────────────
  // ONLY runs when user explicitly commands weave generation (e.g. "generate 3/1 twill").
  // Does NOT run for questions like "what is twill?" or "show me a plain weave".
  const WEAVE_TRIGGER = /\b(plain|twill|satin|herringbone|honeycomb|houndstooth|diamond|dimond|birdseye|zigzag|basket|crepe|mock.?leno|bedford|warp.?rib|weft.?rib|broken.?twill|brighton|tiger|leopard|cheetah|jaguar|floral|flower|petal|rose|lotus|lily|circle|circular|round|ring|peacock|feather|hexagonal|hexagon|wave|ripple|ocean|star|starburst|radial|chevron|spiral|swirl|vortex|cross|lattice|scale|fish.?scale|mermaid|heart|love|arrow)\b/i
  // Strict action trigger — must be a clear command, not a question
  const ACTION_TRIGGER2 = /\b(generate|create|make|apply|give me|set|place|put|load|insert|add)\b/i
  // Exclude if the message is clearly a question (starts with what/which/how/tell/explain/best/top etc.)
  const IS_QUESTION = /^\s*(what|which|how|tell|explain|best|top|most|popular|recommend|why|when|who|is |are |do |does |can |could |would |should |give me (info|details|tips)|list)/i

  if (WEAVE_TRIGGER.test(userMessage) && ACTION_TRIGGER2.test(userMessage) && !IS_QUESTION.test(userMessage)) {
    try {
      const bridgeResult = bridgeNLPToDesign(userMessage)
      const { design, intent, validation, pegPlanText, matrix } = bridgeResult

      // Build action payload to update the peg plan store directly
      const actionPayload = {
        action: {
          type: 'SET_PEG_PLAN',
          description: `Generated ${design.display_name} (${matrix.length}×${matrix[0]?.length ?? 0}) — ${intent.shaft_count_hint} shafts, ${intent.loom_target} loom`,
          payload: {
            text: pegPlanText,
            shaftCount: intent.shaft_count_hint ?? 16,
            warpColorHex: intent.warpColorHex,
            weftColorHex: intent.weftColorHex,
          },
        },
        answer: [
          `Done! I ran the deterministic engine and generated a **${design.display_name}** weave.`,
          validation.errors.length   ? `⚠ ${validation.errors[0]}` : '',
          validation.warnings.length ? `Note: ${validation.warnings[0]}` : '',
          `Shafts needed: ${validation.shaftCount} (${validation.loomTarget} loom). The peg plan is applied to your canvas.`,
        ].filter(Boolean).join(' '),
        // Also expose the bridge result for the UI to use
        bridge: {
          displayName: design.display_name,
          shaftCount: validation.shaftCount,
          loomTarget: validation.loomTarget,
          interlacement: (validation.interlacementRatio * 100).toFixed(1) + '%',
          maxFloat: Math.max(validation.maxWarpFloat, validation.maxWeftFloat),
          warnings: validation.warnings,
          errors: validation.errors,
          repeatSize: `${matrix.length}×${matrix[0]?.length ?? 0}`,
        },
      }

      return NextResponse.json({ result: actionPayload }, { status: 200 })
    } catch (bridgeErr) {
      // Bridge failed — fall through to LLM as fallback
      console.warn('[/api/chat] Bridge failed, falling back to LLM:', bridgeErr)
    }
  }

  let apiKey: string
  try { apiKey = getApiKey() } catch {
    return NextResponse.json({ error: 'API key not set.' }, { status: 500 })
  }

  try {
    const groq = new Groq({ apiKey })

    // llama-3.1-8b-instant: 500k tokens/day free vs 100k for 70b — same quality for our use case
    const MODEL = 'llama-3.1-8b-instant'

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        {
          role: 'user',
          content: siteContext
            ? `<workspace_state>\n${siteContext}\n</workspace_state>\n\nUser Message: ${userMessage}`
            : userMessage,
        },
      ],
      temperature: 0.45,
      max_tokens: 1000,
    })

    const rawText = (completion.choices[0]?.message?.content ?? '').trim()
    
    let parsed: any
    const firstBrace = rawText.indexOf('{')
    const lastBrace = rawText.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace >= firstBrace) {
      let jsonStr = rawText.substring(firstBrace, lastBrace + 1)
      let preamble = rawText.substring(0, firstBrace).trim()
      
      const tryParse = (str: string) => {
        try { return JSON.parse(str) } catch { return null }
      }

      parsed = tryParse(jsonStr)
      // Attempt common repair: missing closing brace
      if (!parsed) parsed = tryParse(jsonStr + '}')
      if (!parsed) parsed = tryParse(jsonStr + '}}')

      if (parsed) {
        // Salvage preamble text into the answer
        if (preamble) {
          if (!parsed.answer) parsed.answer = preamble
          else parsed.answer = preamble + '\n\n' + parsed.answer
        }
      } else {
        // If it's hopelessly broken JSON, don't dump JSON syntax to the user.
        // Just return the preamble (if any) or a generic fallback.
        parsed = { answer: preamble || 'I had trouble parsing my own response. Could you rephrase your question?' }
      }
    } else {
      // No JSON found at all
      parsed = { answer: rawText }
    }

    try {
      // If the LLM returned nlp_design (Mode 5), route it through the deterministic bridge
      if (parsed?.nlp_design) {
        const bridgeResult = bridgeNLPToDesign(userMessage)
        const { design, intent, validation, pegPlanText, matrix } = bridgeResult

        parsed = {
          action: {
            type: 'SET_PEG_PLAN',
            description: `Generated ${design.display_name} (${matrix.length}×${matrix[0]?.length ?? 0}) — ${intent.shaft_count_hint} shafts, ${intent.loom_target} loom`,
            payload: { text: pegPlanText, shaftCount: intent.shaft_count_hint ?? 16 },
          },
          answer: [
            parsed.answer ? parsed.answer + '\n\n' : '',
            `Done! I generated a **${design.display_name}** weave.`,
            validation.errors.length   ? `⚠ ${validation.errors[0]}` : '',
            validation.warnings.length ? `Note: ${validation.warnings[0]}` : '',
            `Shafts needed: ${validation.shaftCount} (${validation.loomTarget} loom). The peg plan is applied to your canvas.`,
          ].filter(Boolean).join(' '),
          bridge: {
            displayName: design.display_name,
            shaftCount: validation.shaftCount,
            loomTarget: validation.loomTarget,
            interlacement: (validation.interlacementRatio * 100).toFixed(1) + '%',
            maxFloat: Math.max(validation.maxWarpFloat, validation.maxWeftFloat),
            warnings: validation.warnings,
            errors: validation.errors,
            repeatSize: `${matrix.length}×${matrix[0]?.length ?? 0}`,
          },
        }
      }
    } catch {
      // Ignore bridge errors, keep the originally parsed LLM response
    }

    return NextResponse.json({ result: parsed }, { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/chat]', msg)
    // Detect rate limit specifically
    if (msg.includes('rate_limit_exceeded') || msg.includes('Rate limit') || msg.includes('429')) {
      return NextResponse.json(
        { error: 'Daily token limit reached on this API key. Please wait ~20 minutes or create a new Groq key at console.groq.com and update .env.local' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: 'Groq API error. Check key and try again.' }, { status: 502 })
  }
}
