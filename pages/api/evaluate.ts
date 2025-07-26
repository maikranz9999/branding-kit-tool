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
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Teste die API-Verbindung und antworte mit einem einfachen JSON: {"test": "erfolg", "model": "claude-3-5-sonnet", "status": "API funktioniert"}`
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
    console.log('API Response:', data)
    
    // Einfache Test-Antwort
    const testResponse = {
      kategorien: [
        {
          name: "API Test",
          kundeninhalt: { 
            message: "API-Verbindung erfolgreich!",
            model: "claude-3-5-sonnet-20241022",
            timestamp: new Date().toISOString()
          },
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
