import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 API Route gestartet')
  
  if (req.method !== 'POST') {
    console.log('❌ Falsche HTTP-Methode:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('✅ POST-Request empfangen')
    
    // Environment Variable prüfen
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('🔑 API Key vorhanden:', apiKey ? 'JA' : 'NEIN')
    console.log('🔑 API Key Anfang:', apiKey ? apiKey.substring(0, 10) + '...' : 'LEER')
    
    // Request Body prüfen
    console.log('📦 Request Body Größe:', JSON.stringify(req.body).length, 'Zeichen')
    
    if (!apiKey) {
      throw new Error('API Key fehlt in Environment Variables')
    }
    
    // Erst mal OHNE API-Call testen
    console.log('✅ Einfache Test-Antwort senden')
    
    const testResponse = {
      kategorien: [
        {
          name: "Debug Test",
          kundeninhalt: { 
            message: "API Route funktioniert!",
            timestamp: new Date().toISOString(),
            apiKeyPresent: !!apiKey
          },
          anforderungen_status: [
            { text: "API-Route erreichbar", status: "erfuellt" }
          ],
          feedback_typ: "keins",
          feedback_text: ""
        }
      ],
      gesamtbewertung: {
        punkte: 100,
        note: "Debug Test erfolgreich"
      }
    }
    
    console.log('✅ Sende Antwort zurück')
    res.status(200).json(testResponse)
    
  } catch (error) {
    console.error('💥 Fehler aufgetreten:', error)
    console.error('💥 Error Stack:', (error as Error).stack)
    
    res.status(500).json({ 
      error: 'Debug-Fehler', 
      message: (error as Error).message,
      stack: (error as Error).stack 
    })
  }
}
