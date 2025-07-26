import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { pdfData, marktpreise, brandingRequirements } = req.body

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfData,
                },
              },
              {
                type: 'text',
                text: `Du bist ein Experte für Hochzeitsbranding. Analysiere dieses PDF komplett und systematisch. 

WICHTIG: Gib ALLE 7 Kategorien zurück, auch wenn du sie nur teilweise analysieren kannst.

MARKTPREISE IN DER HOCHZEITSBRANCHE:
${JSON.stringify(marktpreise, null, 2)}

Analysiere ALLE diese Kategorien der Reihe nach:

1. ZIELGRUPPE (DEMOGRAFISCH) - Extrahiere: Vornamen, Alter, Wohnort, Beruf, Einkommen
2. ZIELGRUPPE (LIFESTYLE) - Extrahiere: Charakterzüge, Hobbies, Urlaub, Lifestyle, Konsum
3. DIE HOCHZEIT DER ZIELGRUPPE - Extrahiere: Budget, Gäste, Location, Stil, Highlights  
4. MOODBOARD DER HOCHZEIT - Beschreibe vorhandene Bilder
5. DEIN ANGEBOT - Extrahiere: Leitsatz, Vorteile, Probleme, Emotionen
6. LEISTUNGEN & PREISE - Extrahiere: Pakete, Preise, Gewerk
7. VISUELLES BRANDING - Extrahiere: Name, Domain, Farben, Schriften

Bewerte nur echte Probleme, nicht Kleinigkeiten.

Antworte mit VOLLSTÄNDIGEM JSON - alle 7 Kategorien:

{
  "kategorien": [
    {"name": "Zielgruppe (demografisch)", "kundeninhalt": {...}, "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."},
    {"name": "Zielgruppe (Lifestyle)", "kundeninhalt": {...}, "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."},
    {"name": "Die Hochzeit der Zielgruppe", "kundeninhalt": {...}, "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."},
    {"name": "Moodboard der Hochzeit", "kundeninhalt": "...", "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."},
    {"name": "Dein Angebot", "kundeninhalt": {...}, "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."},
    {"name": "Leistungen & Preise", "kundeninhalt": {...}, "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."},
    {"name": "Visuelles Branding", "kundeninhalt": {...}, "anforderungen_status": [...], "feedback_typ": "keins|hinweis|problem", "feedback_text": "..."}
  ],
  "gesamtbewertung": {"punkte": 85, "note": "Gut"}
}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('API Error:', response.status, errorData)
      throw new Error(`API-Fehler: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    let responseText = data.content[0].text
    
    // Clean up JSON response
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    
    try {
      const evaluationData = JSON.parse(responseText)
      res.status(200).json(evaluationData)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Response Text:', responseText.substring(0, 500))
      
      // Fallback mit partieller Antwort
      res.status(200).json({
        kategorien: [
          {
            name: "Analyse-Fehler",
            kundeninhalt: { error: "JSON Parse Fehler - Response war nicht im erwarteten Format" },
            anforderungen_status: [
              { text: "PDF-Analyse", status: "problem" }
            ],
            feedback_typ: "problem",
            feedback_text: "Die API-Antwort konnte nicht richtig verarbeitet werden. Bitte versuchen Sie es mit einem kleineren oder einfacheren PDF."
          }
        ],
        gesamtbewertung: {
          punkte: 0,
          note: "Analyse fehlgeschlagen"
        }
      })
    }
    
  } catch (error) {
    console.error('Evaluation Error:', error)
    res.status(500).json({ 
      error: 'Fehler bei der Bewertung', 
      details: (error as Error).message 
    })
  }
}
