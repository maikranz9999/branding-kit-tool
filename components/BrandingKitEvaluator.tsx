import React, { useState, useRef } from 'react';
import { Upload, FileText, Bot, CheckCircle, AlertTriangle, XCircle, Download, Star } from 'lucide-react';

const BrandingKitEvaluator: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationComplete, setEvaluationComplete] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF-Parsing mit strukturiertem Prompt
  const parsePDFContent = async (file: File) => {
    try {
      setProcessingStep('PDF wird konvertiert...');
      
      // PDF als base64 konvertieren mit TypeScript-sicherer Implementierung
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(",")[1];
            resolve(base64);
          } else {
            reject(new Error("Failed to read file as string"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      setProcessingStep('Text wird extrahiert...');
      
      // Claude API für PDF-Text-Extraktion mit strukturiertem Prompt
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: `Extrahiere bitte den Text aus diesem Branding Kit PDF-Dokument mit folgender Struktur:

WICHTIGE ANWEISUNGEN FÜR BRANDING KIT:
- Das PDF hat eine dreispaltige Struktur
- LINKE SPALTE: Enthält Bezeichnungen/Fragen - diese komplett extrahieren
- MITTLERE SPALTE: Enthält die Kundenantworten - diese komplett extrahieren  
- RECHTE SPALTE (gelb hinterlegt): Beispieltexte - diese IGNORIEREN, nicht extrahieren

Das Branding Kit hat folgende 7 Hauptbereiche:
1. Zielgruppe (demografisch)
2. Zielgruppe (Lifestyle) 
3. Die Hochzeit der Zielgruppe
4. Moodboard der Hochzeit
5. Dein Angebot
6. Leistungen & Preise
7. Visuelles Branding

Gib den extrahierten Text in folgendem Format zurück:

=== BEREICHSNAME ===
FELD: [Kundenantwort aus mittlerer Spalte]
FELD: [Kundenantwort aus mittlerer Spalte]

---

Beispiel:
=== 1. Zielgruppe (demografisch) ===
Vornamen des Paares: Anna und Lukas
Alter: 33 und 35
Wohnort: München

---

Extrahiere ALLE 7 Bereiche vollständig. Ignoriere dabei die gelben Beispielspalten komplett.`,
                },
              ],
            },
          ]
        })
      });

      setProcessingStep('Text wird verarbeitet...');

      if (!response.ok) {
        throw new Error(`PDF extraction failed: ${response.status}`);
      }

      const data = await response.json();
      const extractedText = data.content[0].text;
      
      if (!extractedText || extractedText.length < 50) {
        throw new Error('Zu wenig Text aus PDF extrahiert');
      }
      
      console.log("Extracted text length:", extractedText.length);
      console.log("Extracted text preview:", extractedText.substring(0, 200));
      
      setProcessingStep('Branding-Bereiche werden erkannt...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Echte Datenextraktion aus dem extrahierten Text
      const extractedData = await extractBrandingDataFromText(extractedText);
      
      setProcessingStep('PDF-Analyse abgeschlossen');
      return extractedData;
      
    } catch (error) {
      console.error('PDF-Parsing Fehler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setProcessingStep('Fehler beim PDF-Parsing: ' + errorMessage);
      
      alert(`Fehler beim Lesen der Datei: ${errorMessage}. Bitte verwende die manuelle Texteingabe unten.`);
      return null;
    }
  };

  // Echte Datenextraktion aus dem extrahierten Text
  const extractBrandingDataFromText = async (text: string) => {
    return {
      "1. Zielgruppe (demografisch)": {
        "Vornamen des Paares": extractField(text, ['vornamen des paares', 'vorname', 'namen']),
        "Alter": extractField(text, ['alter', 'jahre', 'jahr']),
        "Wohnort": extractField(text, ['wohnort', 'stadt', 'ort']),
        "Lage des Wohnorts": extractField(text, ['lage', 'stadtrand', 'innenstadt', 'dorf', 'ländlich']),
        "Art des Wohnens": extractField(text, ['art des wohnens', 'wohnen', 'haus', 'wohnung', 'villa']),
        "Bildungsstand": extractField(text, ['bildungsstand', 'bildung', 'studium', 'abitur', 'ausbildung']),
        "Kinder/Familienleben": extractField(text, ['kinder', 'familienleben', 'familie', 'nachwuchs']),
        "Beruf": extractField(text, ['beruf', 'job', 'arbeitet', 'tätig']),
        "Jahreseinkommen (netto)": extractField(text, ['jahreseinkommen', 'einkommen', 'verdienst', 'gehalt', 'netto'])
      },
      "2. Zielgruppe (Lifestyle)": {
        "Charakterzüge & Verhalten": extractField(text, ['charakterzüge', 'charakter', 'persönlichkeit', 'verhalten']),
        "Hobbies & Interessen": extractField(text, ['hobbies', 'hobbys', 'interessen', 'freizeit']),
        "Urlaub/Reiseverhalten": extractField(text, ['urlaub', 'reiseverhalten', 'reisen', 'verreisen']),
        "Lifestyle": extractField(text, ['lifestyle', 'lebensstil', 'leben']),
        "Art der Inneneinrichtung": extractField(text, ['inneneinrichtung', 'einrichtung', 'wohnen', 'stil']),
        "Konsumverhalten/Lieblingsbrands": extractField(text, ['konsumverhalten', 'lieblingsbrands', 'marken', 'brands']),
        "Social-Media-Verhalten": extractField(text, ['social media', 'social-media', 'instagram', 'facebook'])
      },
      "3. Die Hochzeit der Zielgruppe": {
        "Budget der Hochzeit": extractField(text, ['budget der hochzeit', 'budget', 'kosten', '€', 'euro']),
        "Anzahl der Gäste": extractField(text, ['anzahl der gäste', 'gäste', 'personen', 'anzahl']),
        "Ort der Location": extractField(text, ['ort der location', 'location', 'ort', 'wo']),
        "Art der Location": extractField(text, ['art der location', 'scheune', 'schloss', 'villa', 'restaurant']),
        "Highlights der Hochzeit": extractField(text, ['highlights', 'besonders', 'speziell', 'wünsche']),
        "Stil der Hochzeit": extractField(text, ['stil der hochzeit', 'stil', 'boho', 'rustikal', 'elegant']),
        "Worauf legt die Zielgruppe Wert": extractField(text, ['worauf legt', 'wert', 'wichtig', 'priorität'])
      },
      "4. Moodboard der Hochzeit": {
        "Beschreibung": extractField(text, ['moodboard', 'bilder', 'inspiration', 'visual']),
        "Anzahl Bilder": extractImageCount(text),
        "Bereiche": extractField(text, ['bereiche', 'kategorien', 'location', 'deko'])
      },
      "5. Dein Angebot": {
        "Leitsatz/Mission": extractField(text, ['leitsatz', 'mission', 'motto', 'slogan']),
        "Vorteile für Kunden": extractField(text, ['vorteile für kunden', 'vorteile', 'nutzen', 'benefit']),
        "Gelöste Probleme": extractField(text, ['gelöste probleme', 'probleme', 'lösung', 'hilfe']),
        "Ausgelöste Emotionen": extractField(text, ['ausgelöste emotionen', 'emotionen', 'gefühle', 'erleben']),
        "Kosten ohne Leistung": extractField(text, ['kosten ohne leistung', 'kosten ohne', 'risiko', 'verzicht'])
      },
      "6. Leistungen & Preise": {
        "Paket 1": extractField(text, ['paket 1', 'basis', 'grundpaket', 'starter']),
        "Paket 2": extractField(text, ['paket 2', 'standard', 'erweitert', 'plus']),
        "Paket 3": extractField(text, ['paket 3', 'premium', 'umfangreich', 'pro']),
        "Paket 4": extractField(text, ['paket 4', 'luxury', 'vollservice', 'deluxe']),
        "Preisstruktur": extractPricing(text)
      },
      "7. Visuelles Branding": {
        "Marke/Name": extractField(text, ['marke', 'name', 'firmenname', 'brand']),
        "Website (URL)": extractWebsite(text),
        "CI-Farben": extractField(text, ['ci-farben', 'farben', 'farbpalette', 'farbe']),
        "Schriftarten": extractField(text, ['schriftarten', 'schrift', 'font', 'typography']),
        "Logo": extractField(text, ['logo', 'signet', 'zeichen', 'symbol'])
      }
    };
  };

  // Hilfsfunktion: Feld aus Text extrahieren
  const extractField = (text: string, keywords: string[]): string => {
    const lowerText = text.toLowerCase();
    
    for (let keyword of keywords) {
      const index = lowerText.indexOf(keyword.toLowerCase());
      if (index !== -1) {
        // Finde den Kontext um das Keyword
        const start = Math.max(0, index);
        const end = Math.min(text.length, index + 300);
        let context = text.substring(start, end);
        
        // Versuche den eigentlichen Wert zu extrahieren (nach dem Keyword)
        const lines = context.split(/[\n\r]/);
        const keywordLine = lines.find(line => line.toLowerCase().includes(keyword.toLowerCase()));
        
        if (keywordLine) {
          // Extrahiere Text nach dem Keyword
          const parts = keywordLine.split(':');
          if (parts.length > 1) {
            return parts[1].trim().substring(0, 200);
          }
        }
        
        // Fallback: Kontext um das Keyword
        return context.trim().substring(0, 150);
      }
    }
    return "Nicht in PDF gefunden";
  };

  // Spezielle Extraktion für Bildanzahl
  const extractImageCount = (text: string): string => {
    const numbers = text.match(/(\d+)\s*(bild|foto|image)/gi);
    if (numbers && numbers.length > 0) {
      return numbers[0];
    }
    return "Bildanzahl nicht erkannt";
  };

  // Spezielle Extraktion für Preise
  const extractPricing = (text: string): string => {
    const priceMatches = text.match(/\d+[.,]?\d*\s*€/g);
    if (priceMatches && priceMatches.length > 0) {
      return `Preise gefunden: ${priceMatches.slice(0, 5).join(', ')}`;
    }
    return "Keine Preise erkannt";
  };

  // Spezielle Extraktion für Website
  const extractWebsite = (text: string): string => {
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w]{2,}/g);
    if (urlMatch && urlMatch.length > 0) {
      return urlMatch[0];
    }
    return "Keine Website gefunden";
  };

  // KI-Bewertung basierend auf echten extrahierten PDF-Daten
  const evaluateExtractedData = async (extractedData: any) => {
    try {
      setProcessingStep('KI-Bewertung wird durchgeführt...');
      
      // Claude API für intelligente Bewertung der echten Daten
      const evaluationPrompt = `
Bewerte das folgende Branding Kit nach den dokumentierten Qualitätskriterien. Verwende die ECHTEN extrahierten Daten des Kunden.

EXTRAHIERTE KUNDENDATEN:
${JSON.stringify(extractedData, null, 2)}

BEWERTUNGSANFORDERUNGEN:
- Verwende NUR die echten Kundendaten aus der Extraktion
- Schreibe "Nicht in PDF gefunden" nur wenn wirklich nichts extrahiert wurde
- Gib konkrete Zitate aus den Kundendaten wieder
- Verwende lockeren Facebook-Tonfall mit Du-Form und Smileys 😊
- Bewerte nach den Branding Kit Qualitätskriterien

BEWERTUNGSKRITERIEN:

1. ZIELGRUPPE DEMOGRAFISCH:
- Alle Felder ausgefüllt?
- Konkrete Angaben (nicht "Mitte 30" sondern "33 und 35")?
- Einkommen mindestens 80.000€?
- Beruf-Einkommen plausibel?

2. ZIELGRUPPE LIFESTYLE:
- Charakterzüge ausreichend detailliert (nicht nur 1-2 Wörter)?
- Lifestyle passt zum Einkommen (Luxus-Hobbys brauchen hohes Einkommen)?

3. HOCHZEIT ZIELGRUPPE:
- Budget mindestens 35.000€?
- Pro-Gast-Budget mindestens 450€ (Budget ÷ Gäste)?
- Stil und Location-Art passen zusammen?

4. MOODBOARD:
- Mindestens 45 Bilder?
- Alle 7 Pflichtbereiche vorhanden?

5. ANGEBOT:
- Leitsatz enthält "Hochzeit" oder "Wedding"?
- Leitsatz nicht zu schwammig?

6. LEISTUNGEN & PREISE:
- Keine Stundensätze (€/h, pro Stunde)?
- Verschiedene Pakete vorhanden (3-4 Pakete optimal)?
- Preisstruktur logisch aufbauend?
- Preise angemessen für Gewerk und Zielgruppe?

7. VISUELLES BRANDING:
- Markenname nicht kitschig ("Zauber", "Traum", etc.)?
- Genau 3 CI-Farben?
- Domain nicht .shop/.org?
- Moderne Schriftkombination?

Antworte mit JSON im folgenden Format:
{
  "overallScore": 75,
  "sections": [
    {
      "title": "1. Zielgruppe (demografisch)",
      "score": 85,
      "status": "good/warning/error",
      "customerData": {die echten extrahierten Daten für diesen Bereich},
      "issues": [
        {
          "type": "info/warning/error",
          "message": "Feedback mit Du-Form und konkreten Zitaten aus den Kundendaten"
        }
      ],
      "details": {
        "completeness": "Status",
        "concreteness": "Status",
        "plausibility": "Status"
      }
    }
  ]
}

WICHTIG: Verwende nur die ECHTEN Kundendaten, keine erfundenen Beispiele!`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: evaluationPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Bewertung fehlgeschlagen: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // JSON aus Antwort extrahieren
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      if (!responseText.startsWith('{')) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          responseText = jsonMatch[0];
        } else {
          throw new Error("Keine gültige Bewertung erhalten");
        }
      }
      
      const evaluationResult = JSON.parse(responseText);
      
      setProcessingStep('Bewertung abgeschlossen');
      return evaluationResult;
      
    } catch (error) {
      console.error('Bewertungsfehler:', error);
      
      // Fallback: Basis-Bewertung mit echten Daten
      return createFallbackEvaluation(extractedData);
    }
  };

  // Fallback-Bewertung wenn KI-API nicht verfügbar
  const createFallbackEvaluation = (extractedData: any) => {
    return {
      overallScore: 50,
      sections: Object.keys(extractedData).map((title, index) => ({
        title,
        score: 60,
        status: "warning" as const,
        customerData: extractedData[title],
        issues: [
          { type: "warning" as const, message: "KI-Bewertung nicht verfügbar - bitte manuell prüfen 😊" }
        ],
        details: {
          completeness: "Manuelle Prüfung erforderlich",
          quality: "Manuelle Prüfung erforderlich",
          plausibility: "Manuelle Prüfung erforderlich"
        }
      }))
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
      }
    }
  };

  const startEvaluation = async () => {
    if (!uploadedFile) {
      alert('Bitte lade erst dein Branding Kit PDF hoch! 😊');
      return;
    }

    setIsEvaluating(true);
    
    try {
      // PDF-Parsing
      const extractedData = await parsePDFContent(uploadedFile);
      
      if (extractedData) {
        // KI-Bewertung basierend auf echten PDF-Daten
        const results = await evaluateExtractedData(extractedData);
        setEvaluationResults(results);
      }
      
      setIsEvaluating(false);
      setEvaluationComplete(true);
      
    } catch (error) {
      console.error('Evaluation Error:', error);
      setProcessingStep('Fehler bei der Bewertung');
      setIsEvaluating(false);
    }
  };

  const resetEvaluation = () => {
    setUploadedFile(null);
    setIsEvaluating(false);
    setEvaluationComplete(false);
    setEvaluationResults(null);
    setProcessingStep('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const generateDetailedReport = () => {
    if (!evaluationResults) return '';
    
    let report = `BRANDING KIT - KI-BEWERTUNG\n`;
    report += `============================\n\n`;
    report += `PDF-Datei: ${uploadedFile?.name || 'Nicht verfügbar'}\n`;
    report += `Bewertungsdatum: ${new Date().toLocaleDateString('de-DE')}\n`;
    report += `Gesamtbewertung: ${evaluationResults.overallScore}/100 Punkte\n\n`;
    
    evaluationResults.sections.forEach((section: any) => {
      report += `${section.title}\n`;
      report += `${'='.repeat(section.title.length)}\n`;
      report += `Bewertung: ${section.score}/100 Punkte\n\n`;
      
      report += `Deine Angaben:\n`;
      Object.entries(section.customerData).forEach(([key, value]) => {
        report += `• ${key}: ${value}\n`;
      });
      report += `\n`;
      
      if (section.issues.length > 0) {
        report += `Feedback:\n`;
        section.issues.forEach((issue: any) => {
          const prefix = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          report += `${prefix} ${issue.message}\n`;
        });
        report += `\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  };

  const downloadReport = () => {
    const report = generateDetailedReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Branding_Kit_Bewertung_${uploadedFile?.name?.replace('.pdf', '')}_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (evaluationComplete && evaluationResults) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Deine Branding Kit Bewertung</h1>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Star className="w-6 h-6 text-yellow-500 fill-current" />
            <span className={`text-4xl font-bold ${getScoreColor(evaluationResults.overallScore)}`}>
              {evaluationResults.overallScore}/100 Punkte
            </span>
          </div>
          <p className="text-gray-600">Bewertung für: {uploadedFile?.name}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
          {evaluationResults.sections.map((section: any, index: number) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              
              {/* Header mit Titel und Score */}
              <div className={`p-4 ${
                section.status === 'error' ? 'bg-red-100 border-b border-red-200' :
                section.status === 'warning' ? 'bg-yellow-100 border-b border-yellow-200' :
                'bg-green-100 border-b border-green-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800">{section.title}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(section.status)}
                    <span className={`text-xl font-bold ${getScoreColor(section.score)}`}>
                      {section.score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Deine Angaben aus PDF */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Deine Angaben aus der PDF:
                  </h4>
                  <div className="space-y-2">
                    {section.customerData && Object.entries(section.customerData).map(([key, value]: [string, any]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600 ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KI-Bewertung und Feedback */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Unser Feedback:
                  </h4>
                  
                  {/* Bewertungsdetails */}
                  {section.details && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="text-sm space-y-1">
                        {Object.entries(section.details).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-blue-800">• {value}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues und Hinweise */}
                  <div className="space-y-2">
                    {section.issues.map((issue: any, issueIndex: number) => (
                      <div key={issueIndex} className={`text-sm p-3 rounded border-l-4 ${
                        issue.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
                        issue.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                        'bg-blue-50 border-blue-400 text-blue-800'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold">
                            {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                          </span>
                          <span>{issue.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Die wichtigsten Punkte für dich
          </h2>
          <div className="space-y-3">
            {evaluationResults.sections
              .filter((s: any) => s.issues.some((i: any) => i.type === 'error' || i.type === 'warning'))
              .slice(0, 3)
              .map((section: any, index: number) => (
                <div key={index} className="p-3 bg-white rounded border-l-4 border-yellow-400">
                  <div className="font-medium text-gray-800">{section.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {section.issues.find((i: any) => i.type === 'error' || i.type === 'warning')?.message}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Bewertungsbericht herunterladen
          </button>
          
          <button
            onClick={resetEvaluation}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Neue Bewertung starten
          </button>
        </div>
      </div>
    );
  }

  if (isEvaluating) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Bot className="w-8 h-8 text-blue-600 animate-pulse" />
            <h1 className="text-3xl font-bold text-gray-800">KI analysiert deine PDF</h1>
          </div>
          
          <div className="bg-blue-50 p-8 rounded-lg mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800 font-medium mb-2">{processingStep || 'Analyse läuft...'}</p>
            <p className="text-blue-600 text-sm">
              {processingStep.includes('konvertiert') ? 'PDF-Datei wird verarbeitet' : 
               processingStep.includes('extrahiert') ? 'Text und Daten werden aus der PDF geholt' :
               processingStep.includes('erkannt') ? 'Die 7 Branding-Bereiche werden identifiziert' :
               processingStep.includes('verarbeitet') ? 'Deine Angaben werden den Bewertungskriterien zugeordnet' :
               processingStep.includes('Bewertung') ? 'Qualitätsbewertung nach Branchenstandards' :
               'Deine PDF wird intelligent analysiert'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className={`p-4 rounded transition-colors ${
              processingStep.includes('konvertiert') ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'
            }`}>
              {processingStep.includes('konvertiert') ? '🔄' : '✓'} PDF-Verarbeitung
            </div>
            <div className={`p-4 rounded transition-colors ${
              processingStep.includes('extrahiert') ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'
            }`}>
              {processingStep.includes('extrahiert') ? '🔄' : processingStep.includes('verarbeitet') ? '✓' : '⏳'} Text-Extraktion
            </div>
            <div className={`p-4 rounded transition-colors ${
              processingStep.includes('erkannt') ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'
            }`}>
              {processingStep.includes('erkannt') ? '🔄' : processingStep.includes('abgeschlossen') ? '✓' : '⏳'} Bereich-Erkennung
            </div>
            <div className={`p-4 rounded transition-colors ${
              processingStep.includes('Bewertung') ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'
            }`}>
              {processingStep.includes('Bewertung') ? '🔄' : '⏳'} Qualitätsbewertung
            </div>
          </div>

          <div className="text-sm text-gray-500 mt-4">
            Analysiere: {uploadedFile?.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Branding Kit KI-Bewertungstool
        </h1>
        <p className="text-gray-600">
          Lade dein Branding Kit PDF hoch und erhalte eine professionelle KI-Bewertung
        </p>
      </div>

      {!uploadedFile ? (
        <div className="mb-8">
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              isDragOver ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {isDragOver ? 'PDF hier ablegen!' : 'Branding Kit PDF hochladen'}
            </h3>
            <p className={`mb-4 transition-colors duration-300 ${
              isDragOver ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {isDragOver 
                ? 'Lass die Datei los um sie hochzuladen' 
                : 'Klick hier oder zieh deine PDF-Datei hierher'
              }
            </p>
            <div className={`text-sm transition-colors duration-300 ${
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            }`}>
              Unterstützte Formate: PDF
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">{uploadedFile.name}</p>
              <p className="text-sm text-green-600">PDF erfolgreich hochgeladen</p>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Bereit für KI-Bewertung 🚀
            </h3>
            <p className="text-blue-700 mb-4">
              Unsere KI analysiert dein Branding Kit nach professionellen Standards:
            </p>
            <ul className="text-blue-700 text-sm space-y-1 mb-6">
              <li>• <strong>Vollständigkeitsprüfung:</strong> Sind alle Bereiche ausgefüllt?</li>
              <li>• <strong>Qualitätsbewertung:</strong> Ausreichend detailliert und durchdacht?</li>
              <li>• <strong>Plausibilitätschecks:</strong> Passt alles logisch zusammen?</li>
              <li>• <strong>Zielgruppen-Konsistenz:</strong> Stimmt Budget, Lifestyle und Angebot überein?</li>
              <li>• <strong>Branchenstandards:</strong> Moderne, professionelle Gestaltung?</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={startEvaluation}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Bot className="w-5 h-5" />
              KI-Bewertung starten
            </button>
            
            <button
              onClick={() => setUploadedFile(null)}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Andere PDF wählen
            </button>
          </div>
        </div>
      )}

      {/* Hinweise */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">So funktioniert's:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Lade dein ausgefülltes Branding Kit als PDF hoch</li>
          <li>• Die KI extrahiert automatisch alle Informationen</li>
          <li>• Du erhältst eine detaillierte Bewertung aller 7 Bereiche</li>
          <li>• Konkrete Verbesserungsvorschläge helfen dir weiter</li>
          <li>• Der Bewertungsbericht kann heruntergeladen werden</li>
        </ul>
      </div>
    </div>
  );
};

export default BrandingKitEvaluator;
