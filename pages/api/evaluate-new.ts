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
                text: `Analysiere dieses Branding Kit für Hochzeitsdienstleister und extrahiere den Inhalt aus der mittleren Spalte (ignoriere gelbe Beispieltexte). Bewerte nach den exakten Kriterien und gib nur bei Problemen/Hinweisen Feedback. Führe zusätzlich eine PREISBEWERTUNG durch.

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

Antworte in diesem JSON-Format:

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
        {"text": "Jahreseinkommen: Mindestens 80.000€", "status": "problem"}
      ],
      "feedback_typ": "keins|hinweis|problem",
      "feedback_text": "Text für Problem-Feedback (nur wenn feedback_typ = problem)",
      "hinweis_feedback": {
        "text": "Text für Hinweis-Feedback (zusätzlich möglich)"
      }
    }
  ],
  "gesamtbewertung": {
    "punkte": 85,
    "note": "Sehr gut"
  }
}

WICHTIG: Für jeden Anforderungspunkt bewerte den Status:
- "erfuellt" = grüner Haken (Anforderung vollständig erfüllt)
- "warnung" = gelbes Warnsignal (fast erfüllt, könnte besser sein)
- "problem" = rotes X (Anforderung nicht erfüllt oder fehlt)`,
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
