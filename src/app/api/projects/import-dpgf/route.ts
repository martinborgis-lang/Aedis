import { NextRequest, NextResponse } from 'next/server'
import { ImportResponse } from '@/lib/import/types'

const SYSTEM_PROMPT = `You are an expert in French construction project management (BTP/DPGF).
You analyze DPGF (Décomposition du Prix Global et Forfaitaire) documents.
Return ONLY a valid JSON object. No markdown, no explanation, no code
blocks. Raw JSON only starting with { and ending with }.

CRITICAL INSTRUCTION ON DURATION ESTIMATION:
You tend to overestimate durations. For this task, be deliberately
conservative — estimate durations on the LOW end of what is realistic.
French construction professionals prefer underestimated durations
that they can extend, rather than overestimated ones.

DURATION ESTIMATION RULES (in order of priority):

RULE 1 — Timeline from document (highest priority):
If the PDF mentions any dates, deadlines, durations, planning,
délais, or calendrier for specific lots, USE THOSE VALUES.
Look for: "délai d'exécution", "durée des travaux", dates in tables,
planning annexes, "semaines", "mois" next to lot names.

RULE 2 — Estimate from budget and quantities (if no dates in PDF):
Use this reasoning process:
- Identify the lot type and total budget
- Consider the quantities mentioned (m², m³, ml, units)
- Apply a CONSERVATIVE multiplier:
  - Small lot (<10k€): 3-7 working days
  - Medium lot (10k-50k€): 8-20 working days
  - Large lot (50k-150k€): 15-40 working days
  - Very large lot (>150k€): 30-90 working days
- Always round DOWN to the nearest 5 days
- For gros-oeuvre specifically: even if budget is very large,
  cap at 60 working days unless document says otherwise
- For finishing lots (peintures, sols): keep under 20 days
  unless very large surface areas are specified

RULE 3 — Inter-lot parallelism:
Some lots run in parallel in real French construction:
- PLB-CVC and ELECTRICITE often run in parallel
  (both depend on CLOISONS being started, not finished)
- FACADES and MENUISERIES EXT can partially overlap
- PEINTURES can start before SOLS are finished
- Mark parallel relationships with depends_on using "_partial" suffix:
  depends_on: ["09_partial"] means can start when lot 09 is 50% done.

Return this exact JSON structure:
{
  "project": {
    "name": "string — derive from document title, address, or client name",
    "address": "string — client address if found, else null",
    "client_name": "string — client full name if found, else null",
    "contractor_name": "string — main contractor company name",
    "total_budget_ht": number,
    "total_budget_ttc": number,
    "document_date": "YYYY-MM-DD or null",
    "duration_source": "document_dates | ai_estimate",
    "confidence": "high | medium | low"
  },
  "lots": [
    {
      "number": "01",
      "name": "DEMOLITION",
      "budget_ht": 31560.00,
      "tva_rate": 10,
      "duration_days": 8,
      "duration_source": "document_dates | ai_estimate",
      "contractor_name": "string or null — company assigned to this lot if specified",
      "depends_on": [],
      "can_overlap_with": [],
      "tasks": [
        {
          "name": "Installation de chantier",
          "duration_days": 2,
          "budget_ht": 2400.00,
          "description": "brief description of what this task involves"
        },
        {
          "name": "Démolition lourde",
          "duration_days": 5,
          "budget_ht": 14070.00,
          "description": "350m³ de démolition lourde + évacuation gravois"
        }
      ]
    }
  ],
  "ai_notes": "string — any observations about the document, ambiguities found, or assumptions made during analysis"
}

STANDARD FRENCH BTP DEPENDENCIES:
Use these as default, adjust if document implies otherwise:
- 01 DEMOLITION: depends_on []
- 02 VRD: depends_on ["01"]
- 03 GROS-OEUVRE: depends_on ["01", "02"]
- 04 ETANCHEITE: depends_on ["03"]
- 05 MENUISERIES EXT: depends_on ["03", "04"]
- 06 FERRONNERIE: depends_on ["03"]
- 07 FACADES/ENDUITS: depends_on ["04", "05"]
- 08 TERRASSES/BOIS: depends_on ["04"]
- 09 CLOISONS/DOUBLAGE: depends_on ["03", "05"]
- 10 MENUISERIES INT: depends_on ["09"]
- 11 CHAPES: depends_on ["09"]
- 12 REVETEMENTS SOLS: depends_on ["11"]
- 13 PEINTURES: depends_on ["09", "12"]
- 14 PLB-CVC: depends_on ["03"], can_overlap_with: ["09"]
- 15 ELECTRICITE: depends_on ["03"], can_overlap_with: ["09", "14"]

If lot numbers differ, infer from lot name and position.

TASKS PER LOT:
- Generate 2 to 5 tasks per lot
- Extract real sub-section names from the document
- Tasks within a lot are sequential
- Make task names actionable and in French
- Include key quantities in the description when available`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Fichier PDF requis' },
        { status: 400 }
      )
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 20MB' },
        { status: 400 }
      )
    }

    // Lire le PDF et convertir en base64
    const bytes = await file.arrayBuffer()
    const base64PDF = Buffer.from(bytes).toString('base64')

    // Appel Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64PDF
              }
            },
            {
              type: "text",
              text: "Analyze this DPGF and return the JSON as instructed. Be conservative with duration estimates."
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      return NextResponse.json(
        { error: 'Erreur lors de l\'analyse du document' },
        { status: 500 }
      )
    }

    const claudeResponse = await response.json()

    if (!claudeResponse.content || claudeResponse.content.length === 0) {
      return NextResponse.json(
        { error: 'Réponse vide de l\'API Claude' },
        { status: 500 }
      )
    }

    const rawContent = claudeResponse.content[0].text

    // Parser la réponse JSON
    let parsedData: ImportResponse
    try {
      parsedData = JSON.parse(rawContent)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)

      // Retry une fois en cas d'échec de parsing
      console.log('Retrying with Claude API...')
      const retryResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          system: SYSTEM_PROMPT + "\n\nIMPORTANT: Return ONLY valid JSON, no extra text.",
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64PDF
                }
              },
              {
                type: "text",
                text: "Analyze this DPGF and return ONLY valid JSON as instructed. Be conservative with duration estimates."
              }
            ]
          }]
        })
      })

      if (retryResponse.ok) {
        const retryClaudeResponse = await retryResponse.json()
        try {
          parsedData = JSON.parse(retryClaudeResponse.content[0].text)
        } catch {
          return NextResponse.json(
            { error: 'Ce PDF ne peut pas être analysé. Vérifiez le format du document.' },
            { status: 422 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'L\'analyse prend plus de temps que prévu. Réessayez.' },
          { status: 500 }
        )
      }
    }

    // Validation des données
    if (!parsedData.project || !parsedData.lots || parsedData.lots.length === 0) {
      return NextResponse.json(
        { error: 'Aucun lot n\'a été détecté. Vérifiez le format du document.' },
        { status: 422 }
      )
    }

    // Ajouter le nom du fichier original
    const responseData = {
      ...parsedData,
      originalFilename: file.name
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Import DPGF error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}