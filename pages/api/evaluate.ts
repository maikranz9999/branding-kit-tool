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
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Analysiere dieses PDF und gib ein einfaches JSON zurück: {"test": "erfolg", "status": "API funktioniert"}`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('API Error:', response.status, errorData)
      throw new Error(`API-Fehler: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    
    // Einfache Test-Antwort für jetzt
    const testResponse = {
      kategorien: [
        {
          name: "Test",
          kundeninhalt: { test: "API funktioniert!" },
          anforderungen_status: [
            { text: "API-Verbindung", status: "erfuellt" }
          ],
          feedback_typ: "keins",
          feedback_text: ""
        }
      ],
      gesamtbewertung: {
        punkte: 100,
        note: "API Test erfolgreich"
      }
    }
    
    res.status(200).json(testResponse)
    
  } catch (error) {
    console.error('Evaluation Error:', error)
    res.status(500).json({ 
      error: 'Fehler bei der Bewertung', 
      details: (error as Error).message 
    })
  }
}
