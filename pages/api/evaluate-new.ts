import type { NextApiRequest, NextApiResponse } from 'next'

// Verbesserte JSON-Parsing-Funktion
function extractAndParseJSON(responseText: string) {
  console.log('Trying to parse response text (first 300 chars):', responseText.substring(0, 300))
  console.log('Response text length:', responseText.length)
  
  try {
    // Methode 1: Direkt parsen (falls bereits sauberes JSON)
    return JSON.parse(responseText);
  } catch (e) {
    console.log('Direct JSON parse failed, trying extraction methods...')
    
    // Methode 2: JSON aus Markdown-Blöcken extrahieren
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log('Found JSON in markdown block')
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error('JSON in Markdown-Block konnte nicht geparst werden:', e);
      }
    }

    // Methode 3: JSON zwischen erstem { und letztem } extrahieren
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      console.log(`Extracting JSON from position ${jsonStart} to ${jsonEnd}`)
      try {
        const jsonPart = responseText.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON part (first 200 chars):', jsonPart.substring(0, 200))
        return JSON.parse(jsonPart);
      } catch (e) {
        console.error('Extrahiertes JSON konnte nicht geparst werden:', e);
      }
    }

    // Methode 4: Aggressive Bereinigung
    let cleanedText = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^[^{]*/, '') // Alles vor dem ersten {
      .replace(/[^}]*$/, '') // Alles nach dem letzten }
      .trim();

    console.log('Cleaned text (first 200 chars):', cleanedText.substring(0, 200))
    
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error('Auch nach Bereinigung konnte JSON nicht geparst werden:', e);
      throw new Error(`JSON Parse failed after all attempts: ${e.message}`);
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { pdfData, marktpreise, brandingRequirements } = req.body

    console.log('Starting PDF analysis...')
    console.log('PDF data length:', pdfData?.length || 0)
    console.log('Marktpreise provided:', !!marktpreise)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Aktualisiertes Modell
        max_tokens: 16000,
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
                text: `WICHTIG: Antworte AUSSCHLIESSLICH mit dem JSON-Objekt. Keine zusätzlichen Erklärungen, keine Markdown-Formatierung, kein Text vor oder nach dem JSON!

Analysiere dieses Branding Kit für Hochzeitsdienstleister und extrahiere den Inhalt aus der mittleren Spalte (ignoriere gelbe Beispieltexte). Bewerte nach den exakten Kriterien und gib nur bei Problemen/Hinweisen Feedback. Führe zusätzlich eine PREISBEWERTUNG durch.

WICHTIG: Gib ALLE 7 Kategorien mit vollständigen anforderungen_status Arrays zurück!

MARKTPREISE IN DER HOCHZEITSBRANCHE:
${JSON.stringify(marktpreise, null, 2)}

EXTRAHIERE ZUERST DEN KUNDENINHALT AUS JEDER KATEGORIE:

1. ZIELGRUPPE (DEMOGRAFISCH):
- Vornamen des Paares, Alter, Wohnort, Lage des Wohnorts, Art des Wohnens, Bildungsstand, Kinder/Familienleben, Beruf, Jahreseinkommen

2. ZIELGRUPPE (LIFESTYLE):
- Charakterzüge & Verhalten, Hobbies & Interessen, Urlaub/Reiseverhalten, Lifestyle, Art der Inneneinrichtung, Konsumverhalten/Lieblingsbrands, Social-Media-Verhalten

3. DIE HOCHZEIT DER ZIELGRUPPE:
- Budget der Hochzeit, Anzahl der Gäste, Ort der Location, Art der Location, Highlights der Hochzeit, Stil der Hochzeit, Worauf legt die Zielgruppe besonders Wert

4. MOODBOARD DER HOCHZEIT:
- Beschreibung der vorhandenen Bilder und Kategorien

5. DEIN ANGEBOT:
- Leitsatz/Mission, Vorteile für Kunden, Probleme die gelöst werden, Emotionen, Kosten bei Verzicht

6. LEISTUNGEN & PREISE:
- Pakete mit Namen, Preisen und Leistungen
- Gewerk/Branche des Anbieters

7. VISUELLES BRANDING:
- Marke/Name, Website, CI-Farben, Schriftarten, Logo

BEWERTUNGSKRITERIEN (nur Feedback bei Problemen):

ZIELGRUPPE DEMOGRAFISCH:
- Vornamen: Zwei konkrete Namen (nicht "X und Y")
- Alter: Zwei konkrete Zahlen (nicht "Mitte 30")
- Beruf: Zwei Berufe angegeben (können auch identisch sein)
- Beruf muss konkret sein: PROBLEM bei "selbstständig", "Unternehmer", "Angestellter", "Sachbearbeiter"
- Beruf konkret erlaubt: "Arzt", "Lehrer", "Anwalt", "Marketingmanager", "selbstständig als Berater in Pharma"
- Jahreseinkommen: Mind. 80.000€, muss zu Berufen passen

ZIELGRUPPE LIFESTYLE:
- SYSTEMATISCHE VAGE-ERKENNUNG: Prüfe JEDEN Begriff auf Konkretheit
- TEST-FRAGE: "Kann ich mir darunter konkretes Verhalten/Produkt vorstellen?" NEIN = PROBLEM
- Vage Muster erkennen: "legen Wert auf...", "sind...", "mögen...", "schätzen..."
- Jedes Adjektiv ohne konkrete Handlung/Marke ist vage
- KONKRET = messbare Handlungen, spezifische Marken, konkrete Orte
- Bei JEDEM vagen Begriff: PROBLEM-Status und Nachfrage nach Konkretisierung
- Lifestyle muss zum Jahreseinkommen passen

HOCHZEIT:
- Budget: Mind. 35.000€, pro Gast mind. 450€
- Bei Luxushotels/Fine Art: Pro-Gast-Budget mind. 900-1.000€
- Stil & Location müssen zusammenpassen

MOODBOARD:
- Mind. 6 Bilder, alle 7 Bereiche vorhanden
- Location erkennbar: Außenansicht oder eindeutige Innenansicht erforderlich
- Stilistische Kohärenz
- DIENSTLEISTUNG SICHTBAR: Trauredner = Rednerpult/Zeremonie, DJ = Tanzfläche, Beauty = Hair&Makeup
- AUSNAHME: Hochzeitsplaner (Dienstleistung nicht sichtbar)
- Zeigt Vorstellung der eigenen Dienstleistungs-Ausführung

ANGEBOT:
- "Hochzeiten"/"Weddings" muss im LEITSATZ vorkommen (nicht wegen SEO, sondern für Klarheit)
- Leitsatz max. 90 Zeichen - nicht übertrieben, schwülstig oder kitschig
- Leitsatz soll nicht wie Romantik-Postkarte klingen
- Gewerk muss erkennbar sein
- Probleme müssen echte Kundenprobleme beschreiben (nicht allgemeine Aussagen)
- Emotionen müssen echte Gefühle sein (Geborgenheit, Freude, etc. - nicht "Wow-Effekt")

PREISE:
- Keine Stundensätze! (Das würden wir nicht empfehlen)
- Verschiedene Pakete
- Unklare Begriffe erklären (z.B. "SOS Kit" - was bedeutet das?)
- PREISBEWERTUNG: Vergleiche mit aktuellen Marktpreisen
  * Unter unterem Bereich: PROBLEM - "Das würden wir so nicht machen"
  * Unterer Bereich oder darunter: PROBLEM - "Zu günstig, das empfehlen wir nicht"
  * Durchschnittsbereich: OK - keine Hinweise
  * Oberer Bereich: HINWEIS - "Du bist im Hochpreissegment – Außenauftritt muss exzellent sein"
- PLAUSIBILITÄTSPRÜFUNG: Preisniveau vs. Zielgruppe
  * Beispiel: Pro-Gast-Budget nur 400€, aber Preise im oberen Segment
  * → Warnung: "Deine Zielgruppe ist vermutlich nicht bereit, diese Preise zu zahlen"
- WICHTIG: Identifiziere das Gewerk aus dem Angebot und verwende die passenden Marktpreise

FEEDBACK-FRAMEWORK für alle Kategorien:
1. FEHLER BENENNEN: "Bei [Bereich] hast du [konkreter Fehler]"
2. GRUND ERKLÄREN: "Das empfehlen wir nicht, weil [Begründung für Zielgruppe/Branche]"
3. BESSERES BEISPIEL: "Für deine Zielgruppe würde eher [konkretes Beispiel] passen"

WICHTIG FÜR PREISBEWERTUNG:
1. Erkenne das Gewerk aus "Dein Angebot" (z.B. Hochzeitsplaner, Fotograf, DJ, etc.)
2. Extrahiere alle Paketnamen und Preise aus "Leistungen & Preise"
3. Ordne jeden Preis der passenden Marktpreiskategorie zu
4. Bewerte jeden Preis: unter/unterer/durchschnitt/oberer Bereich
5. Prüfe Plausibilität mit Pro-Gast-Budget der Zielgruppe
6. Gib entsprechendes Feedback (problem/warnung/hinweis/keins)

BRANDING:
- Genau 3 Farben
- Farben müssen modern und hochzeitstypisch sein - NICHT kitschig
- PROBLEMATISCH: Knallrot (#ff0000), Neonfarben, grelle Töne
- HOCHZEITSGEEIGNET: Pastell, Nude, Champagner, Sage, Dusty Rose
- Moderne Schriftkombination

Antworte NUR mit diesem JSON-Format (KEINE anderen Texte oder Formatierungen):

{
  "kategorien": [
    {
      "name": "Zielgruppe (demografisch)",
      "kundeninhalt": {
        "vornamen": "Anna und Lukas",
        "alter": "33 und 35",
        "beruf": "Polizist und Lehrerin",
        "einkommen": "85.000€"
      },
      "anforderungen_status": [
        {"text": "Vornamen: Zwei konkrete Namen", "status": "erfuellt"},
        {"text": "Alter: Zwei konkrete Altersangaben", "status": "warnung"},
        {"text": "Beruf: Zwei konkrete Berufe", "status": "erfuellt"},
        {"text": "Beruf muss konkret sein", "status": "problem"},
        {"text": "Jahreseinkommen: Mindestens 80.000€", "status": "erfuellt"}
      ],
      "feedback_typ": "keins",
      "feedback_text": ""
    }
  ],
  "gesamtbewertung": {
    "punkte": 85,
    "note": "Sehr gut"
  }
}`,
              },
            ],
          },
        ],
      }),
    })

    console.log('Claude API response status:', response.status)
    console.log('Claude API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.text()
      console.error('API Error:', response.status, errorData)
      throw new Error(`API-Fehler: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    let responseText = data.content[0].text
    
    console.log('Received response from Claude (length):', responseText.length)
    console.log('Response starts with:', responseText.substring(0, 100))
    console.log('Response ends with:', responseText.substring(responseText.length - 100))
    
    try {
      const evaluationData = extractAndParseJSON(responseText);
      console.log('Successfully parsed JSON response')
      res.status(200).json(evaluationData)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Full Response Text:', responseText)
      
      // Detailliertere Fallback-Antwort mit mehr Debug-Info
      res.status(200).json({
        kategorien: [
          {
            name: "JSON-Parse-Fehler",
            kundeninhalt: { 
              error: "Die Claude-Antwort konnte nicht als JSON verarbeitet werden",
              debugInfo: {
                responseLength: responseText.length,
                startsWithBrace: responseText.trimStart().startsWith('{'),
                endsWithBrace: responseText.trimEnd().endsWith('}'),
                containsMarkdown: responseText.includes('```'),
                firstChars: responseText.substring(0, 50),
                lastChars: responseText.substring(responseText.length - 50)
              },
              parseError: (parseError as Error).message
            },
            anforderungen_status: [
              { text: "JSON-Verarbeitung", status: "problem" }
            ],
            feedback_typ: "problem",
            feedback_text: `Parse-Fehler: ${(parseError as Error).message}. Debug-Info siehe Kundeninhalt. Bitte versuche es erneut oder kontaktiere den Support.`
          }
        ],
        gesamtbewertung: {
          punkte: 0,
          note: "Verarbeitungsfehler"
        }
      })
    }
    
  } catch (error) {
    console.error('Evaluation Error:', error)
    res.status(500).json({ 
      error: 'Fehler bei der Bewertung', 
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    })
  }
}
