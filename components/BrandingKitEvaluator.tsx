import React, { useState } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, AlertCircle, XCircle, MessageSquare, X, Copy } from 'lucide-react';

const BrandingKitEvaluator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; kategorie: any }>({ open: false, kategorie: null });
  const [feedbackText, setFeedbackText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredFeedback, setHoveredFeedback] = useState<string | null>(null);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'erfuellt':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warnung':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'problem':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <span className="w-4 h-4 text-gray-400">•</span>;
    }
  };

  // Preisdaten aus der Hochzeitsbranche
  const marktpreise = {
    "Hochzeitsplaner": {
      "Komplettplanung": { unter: 4000, durchschnitt: "4500-5000€ Mindesthonorar ODER 20% vom Budget (höherer Betrag gilt)", ober: 6500 },
      "Teilplanung": { unter: 2500, durchschnitt: "2500-3000€ Mindesthonorar ODER ab 40K€ Budget: 12% vom Budget (höherer Betrag gilt)", ober: 3000 },
      "Zeremonienmeister": { unter: 1300, durchschnitt: "1500-1700", ober: 2000 },
      "Locationscout": { unter: 600, durchschnitt: "600-700", ober: 1000 }
    },
    "Fotograf": {
      "Ganztagsreportage (10 Std.)": { unter: 2500, durchschnitt: "2500-3500", ober: 3500 }
    },
    "Videograf": {
      "Ganztagsreportage (10 Std.)": { unter: 3500, durchschnitt: "3500-4500", ober: 4500 }
    },
    "Trauredner": {
      "Traurede schreiben & vortragen": { unter: 1500, durchschnitt: "1500-2000", ober: 2000 }
    },
    "Catering": {
      "Pro Person (Sektempfang-Party Ende)": { unter: 100, durchschnitt: "150", ober: 180 }
    },
    "Stylist": {
      "Braut + Probestyling": { unter: 450, durchschnitt: "500-600", ober: 800 },
      "Braut & Trauzeugin + Probestyling": { unter: 600, durchschnitt: "700-800", ober: 1000 }
    },
    "Sänger, Musiker": {
      "Solo, Trauung": { unter: 600, durchschnitt: "800", ober: 1000 },
      "Solo, Trauung + Sektempfang": { unter: 850, durchschnitt: "1200-1500", ober: 1800 }
    },
    "DJ": {
      "Musik ab Sektempfang - Party open end": { unter: 1800, durchschnitt: "2000", ober: 2500 },
      "Musik ab Dinner - Party open end": { unter: 1000, durchschnitt: "1500", ober: 1800 }
    },
    "Deko-Dienstleistung": {
      "Mindestverleih bei Abholung": { unter: 400, durchschnitt: "400", ober: 800 },
      "Konzept bis 50 PAX": { unter: 2000, durchschnitt: "2500", ober: 3000 },
      "Konzept bis 80 PAX": { unter: 2500, durchschnitt: "3000", ober: 3500 },
      "Konzept bis 100 PAX": { unter: 3000, durchschnitt: "3500", ober: 4000 }
    },
    "Location": {
      "Reine Miete": { unter: 1000, durchschnitt: "1500", ober: 2500 },
      "Getränkepauschale pro Person": { unter: 35, durchschnitt: "35-45", ober: 45 }
    },
    "Papeterie": {
      "STD + Einladungskarten, 50 Stück": { unter: 800, durchschnitt: "1100", ober: 1500 },
      "Tagespapeterie, 100 Personen": { unter: 1500, durchschnitt: "2000", ober: 2500 }
    }
  };

  const brandingRequirements = {
    "Zielgruppe (demografisch)": [
      "Vornamen: Zwei konkrete Namen (z.B. 'Anna und Lukas', nicht 'X und Y')",
      "Alter: Zwei konkrete Altersangaben (z.B. '33 und 35', nicht 'Mitte 30')",
      "Wohnort: Konkreter Ort (z.B. 'München')",
      "Lage: Klare Auswahl ('Innenstadt', 'Stadtrand', 'ländlich')",
      "Art des Wohnens: Klare Auswahl ('freistehendes Haus', 'Villa', 'Penthouse')",
      "Bildungsstand: Konkrete Angaben ('Abitur', 'Doktortitel', 'macht gerade Doktor')",
      "Kinder/Familie: Klare Angaben ('keine Kinder', 'Patchwork', 'schon Eltern')",
      "Beruf: Zwei Berufe angegeben (können auch identisch sein, z.B. 'beide Pflegekraft')",
      "Beruf muss konkret sein: NICHT 'selbstständig', 'Unternehmer', 'Angestellter', 'Sachbearbeiter'",
      "Beruf konkret: GUT 'Arzt', 'Lehrer', 'Anwalt', 'Marketingmanager', 'selbstständig als Berater in Pharma'",
      "Jahreseinkommen: Mindestens 80.000€ netto, muss zu Berufen passen"
    ],
    "Zielgruppe (Lifestyle)": [
      "Alle Felder müssen ausgefüllt sein",
      "Mindestens 3 Wörter pro Feld (nicht nur 'sympathisch')",
      "Konkrete und beschreibende Begriffe statt Schlagworte",
      "Vage Begriffe müssen erklärt werden: 'minimalistisch' - wie genau? 'gesundheitsbewusst' - wo bemerkbar?",
      "Beispiele für zu vage: 'modern', 'elegant', 'sportlich', 'naturverbunden' ohne Konkretisierung",
      "Besser: 'kauft bei Westwing', 'fährt Porsche', 'macht Yoga', 'isst vegan', 'sammelt Kunst'",
      "Lifestyle-Angaben müssen zum Jahreseinkommen passen",
      "Bei Golf/Tennis/Luxusmarken: sechsstelliges Einkommen erforderlich",
      "Social Media Verhalten darf nicht leer bleiben"
    ],
    "Die Hochzeit der Zielgruppe": [
      "Budget: Mindestens 35.000€ als Zahl angegeben",
      "Pro-Gast-Budget: Standard mindestens 450€, Italien/Luxus 900-1.000€",
      "Bei Luxushotels/Fine Art Stil: Pro-Gast-Budget muss mindestens 900-1.000€ betragen",
      "Anzahl Gäste: Muss logisch zum Budget passen",
      "Ort der Location: Muss gefüllt sein, Richtung erkennbar",
      "Art der Location: Muss gefüllt sein (z.B. 'Schloss', 'Scheune', 'Villa')",
      "Stil & Location müssen zusammenpassen (nicht 'Fine Art' in Scheune)",
      "Mindestens ein Highlight nennen, müssen ins Budget passen",
      "Stil der Hochzeit: Klar benannt (z.B. 'Fine Art', 'Boho', 'rustikal')"
    ],
    "Moodboard der Hochzeit": [
      "Mindestens 6 Bilder erforderlich",
      "Alle 7 Pflichtbereiche: Location, Deko & Floristik, Table Setting, Papeterie, Paar, Outfit, Styling",
      "Location muss erkennbar sein: Außenansicht oder eindeutige Innenansicht (Schloss/Scheune/Villa erkennbar)",
      "Stilistische Kohärenz - Bilder müssen zusammenpassen",
      "Vollständige Detail-Darstellung (Outfits komplett, Styling erkennbar)",
      "Konsistenz mit vorherigen Hochzeits-Angaben (Stil, Location)",
      "DIENSTLEISTUNG muss sichtbar sein: Trauredner = Rednerpult/Zeremonie, DJ = Tanzfläche/Equipment, Beauty = Hair&Makeup-Looks",
      "AUSNAHME: Hochzeitsplaner - deren Dienstleistung ist nicht am Moodboard sichtbar",
      "Moodboard zeigt Vorstellung der Dienstleistungs-Ausführung, nicht nur allgemeine Hochzeitsbilder"
    ],
    "Dein Angebot": [
      "'Hochzeiten' oder 'Weddings' muss im Leitsatz vorkommen",
      "Leitsatz max. 90 Zeichen (mit Leerzeichen) - zu lange Leitsätze sind ein Problem",
      "Leitsatz nicht übertrieben, schwülstig, klischeebeladen oder kitschig",
      "Leitsatz soll nicht wie eine Romantik-Postkarte klingen",
      "Gewerk muss erkennbar sein (Planung, Dekoration, Traurede, etc.)",
      "Vorteile müssen ausformuliert sein (nicht nur einzelne Wörter)",
      "Vorteile müssen zur Dienstleistung passen",
      "Probleme müssen echte Kundenprobleme sein (z.B. 'Du verbringst keine Abende mit Recherche')",
      "Emotionen müssen echte Gefühle sein (z.B. Geborgenheit, Gänsehaut, Freude - nicht 'Wow-Effekt')",
      "'Was kostet es...' muss ausformuliert und nachvollziehbar sein"
    ],
    "Leistungen & Preise": [
      "Verschiedene Pakete erstellen (keine Einzelstunden)",
      "KEINE Stundensätze - das würden wir nicht empfehlen",
      "Maximal 3 unterschiedliche Stundenpakete erlaubt",
      "Pakete sollen sich klar unterscheiden",
      "Preise müssen zur Zielgruppe und Budget passen",
      "Hochzeitsplaner: Prozentuale Abrechnung (15-20%) ODER Mindesthonorar - höherer Betrag gilt",
      "Unklare Fachbegriffe sollten erklärt werden (z.B. 'SOS Kit' - was ist das?)",
      "Preise müssen im marktüblichen Rahmen liegen",
      "Unter dem unteren Preisbereich: PROBLEM - das würden wir so nicht machen",
      "Unterer Preisbereich oder darunter: PROBLEM - zu günstig, das empfehlen wir nicht",
      "Durchschnittsbereich: Marktüblich (optimal)",
      "Oberer Preisbereich: Hochpreissegment - Außenauftritt muss exzellent sein",
      "Pro-Gast-Budget der Zielgruppe muss zu den Preisen passen",
      "FEEDBACK-FRAMEWORK: 1) Fehler benennen 2) Grund erklären 3) Besseres Beispiel geben"
    ],
    "Visuelles Branding": [
      "Name: Einprägsam und leicht zu merken (nicht kitschig/verspielt)",
      "Domain: Gut lesbar, max. 30 Zeichen, .de/.com/.at Endungen",
      "Genau 3 Hauptfarben (nicht mehr, nicht weniger)",
      "Farben müssen modern und hochzeitstypisch sein - NICHT kitschig",
      "Problematische Farben: Knallrot (#ff0000), Neonfarben, zu grelle/schreiende Töne",
      "Hochzeitsgeeignete Farben: Pastell, Nude, Champagner, Sage, Dusty Rose, elegante Töne",
      "Schriften: Modern, keine Comic Sans/Papyrus - das empfehlen wir nicht für Hochzeitsbranche",
      "Schriftkombination: Elegante Serif + Sans-Serif oder Script nur als Akzent",
      "FEEDBACK-FRAMEWORK beachten: 1) Fehler benennen 2) Grund für Zielgruppe erklären 3) Besseres Beispiel"
    ]
  };

  // Audio functions
  const playStartSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Start-Audio nicht verfügbar:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio nicht verfügbar:', error);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileProcess(droppedFile);
    }
  };

  const handleFileProcess = async (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf') {
      setError('Bitte laden Sie nur PDF-Dateien hoch.');
      return;
    }

    setFile(uploadedFile);
    setError('');
    setEvaluation(null);
    
    await evaluateBrandingKit(uploadedFile);
  };

  const openFeedbackModal = (kategorie: any) => {
    setFeedbackModal({ open: true, kategorie });
    setFeedbackText('');
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ open: false, kategorie: null });
    setFeedbackText('');
  };

  const copyFeedbackText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Visual feedback that text was copied
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  const copyFeedbackToClipboard = () => {
    const kategorie = feedbackModal.kategorie;
    if (!kategorie) return;

    const feedbackData = `FEEDBACK FÜR KATEGORIE: ${kategorie.name}
${'='.repeat(50)}

AKTUELLER KUNDENINHALT:
${typeof kategorie.kundeninhalt === 'object' && kategorie.kundeninhalt !== null
  ? Object.entries(kategorie.kundeninhalt)
      .map(([key, value]) => `${key}: ${typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value) || '-'}`)
      .join('\n')
  : kategorie.kundeninhalt || 'Keine Einträge gefunden'
}

AKTUELLE ANFORDERUNGEN IM SYSTEM:
${(brandingRequirements[kategorie.name as keyof typeof brandingRequirements] || []).map(req => `• ${req}`).join('\n')}

AKTUELLER STATUS DER ANFORDERUNGEN:
${kategorie.anforderungen_status 
  ? kategorie.anforderungen_status.map((req: any) => `${req.status === 'erfuellt' ? '✅' : req.status === 'warnung' ? '⚠️' : '❌'} ${req.text}`).join('\n')
  : 'Keine Status-Informationen verfügbar'
}

AKTUELLES FEEDBACK:
${kategorie.feedback_typ && kategorie.feedback_typ !== 'keins' 
  ? `Typ: ${kategorie.feedback_typ}\nText: ${kategorie.feedback_text}`
  : 'Kein Feedback (alle Anforderungen erfüllt)'
}

MEIN FEEDBACK/KORREKTUREN:
${feedbackText}

${'='.repeat(50)}
Bitte korrigiere die Bewertungskriterien für diese Kategorie entsprechend meinem Feedback.`;

    navigator.clipboard.writeText(feedbackData).then(() => {
      alert('Feedback wurde in die Zwischenablage kopiert! Sie können es nun in den Chat einfügen.');
      closeFeedbackModal();
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = feedbackData;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Feedback wurde in die Zwischenablage kopiert! Sie können es nun in den Chat einfügen.');
      closeFeedbackModal();
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    await handleFileProcess(uploadedFile);
  };

  const evaluateBrandingKit = async (pdfFile: File) => {
    setLoading(true);
    setError('');

    playStartSound();

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
        reader.readAsDataURL(pdfFile);
      });

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfData: base64Data,
          marktpreise,
          brandingRequirements
        }),
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      const evaluationData = await response.json();
      setEvaluation(evaluationData);
      
      playNotificationSound();
      
    } catch (err) {
      console.error('Fehler bei der Bewertung:', err);
      setError(`Fehler bei der Bewertung: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!evaluation) return;
    
    let report = `BRANDING KIT BEWERTUNGSREPORT
${'='.repeat(50)}

GESAMTBEWERTUNG: ${evaluation.gesamtbewertung.punkte}/100 Punkte (${evaluation.gesamtbewertung.note})

DETAILLIERTE BEWERTUNG PRO KATEGORIE:
${'-'.repeat(50)}
`;

    evaluation.kategorien.forEach((kategorie: any, idx: number) => {
      report += `
${idx + 1}. ${kategorie.name}
${'-'.repeat(30)}

KUNDENINHALT:
${typeof kategorie.kundeninhalt === 'object' 
  ? Object.entries(kategorie.kundeninhalt).map(([key, value]) => `${key}: ${value || '-'}`).join('\n')
  : kategorie.kundeninhalt || 'Keine Einträge gefunden'
}

ANFORDERUNGEN STATUS:
${kategorie.anforderungen_status ? 
  kategorie.anforderungen_status.map((req: any) => `${req.status === 'erfuellt' ? '✅' : req.status === 'warnung' ? '⚠️' : '❌'} ${req.text}`).join('\n') :
  (brandingRequirements[kategorie.name as keyof typeof brandingRequirements] || []).map(req => `• ${req}`).join('\n')
}

${kategorie.feedback_typ && kategorie.feedback_typ !== 'keins' ? `
${kategorie.feedback_typ === 'problem' ? 'PROBLEM' : 'HINWEIS'}:
${kategorie.feedback_text}
` : 'STATUS: ✅ Alle Anforderungen erfüllt'}

${'='.repeat(50)}
`;
    });

    report += `
Erstellt am: ${new Date().toLocaleDateString('de-DE')}
`;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `branding_kit_bewertung_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearAll = () => {
    setFile(null);
    setEvaluation(null);
    setError('');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Branding Kit Bewertungstool
            </h1>
            <p className="text-gray-600">
              Für Hochzeitsdienstleister - Bewerten Sie Ihr Branding Worksheet professionell
            </p>
          </div>

          {/* Upload Bereich */}
          <div className="mb-8">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                isDragOver 
                  ? 'border-gray-600 bg-gray-100 scale-105 shadow-lg transform' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 ${
                isDragOver ? 'text-gray-700 scale-110' : 'text-gray-400'
              }`} />
              <label htmlFor="file-input" className="cursor-pointer">
                <span className={`text-lg font-medium transition-colors ${
                  isDragOver ? 'text-gray-800' : 'text-gray-700 hover:text-gray-600'
                }`}>
                  {isDragOver ? 'PDF hier ablegen!' : 'Branding Kit PDF hochladen'}
                </span>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className={`mt-2 transition-colors ${
                isDragOver ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {isDragOver ? 'Loslassen zum Hochladen' : 'Ihr ausgefülltes Branding Worksheet (3-Spalten-Format) oder per Drag & Drop'}
              </p>
            </div>
          </div>

          {/* Datei Info */}
          {file && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800">{file.name}</span>
                </div>
                <button
                  onClick={clearAll}
                  className="text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Neu starten
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Bewerte Ihr Branding Kit...</span>
              </div>
            </div>
          )}

          {/* Fehler */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Bewertungsergebnisse */}
          {evaluation && (
            <div className="space-y-8">
              {/* Gesamtbewertung */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Gesamtbewertung</h2>
                    <p className="text-purple-100">
                      Bewertung: {evaluation.gesamtbewertung.punkte}/100 Punkte ({evaluation.gesamtbewertung.note})
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{evaluation.gesamtbewertung.punkte}</div>
                    <div className="text-sm opacity-90">{evaluation.gesamtbewertung.note}</div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={downloadReport}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Bewertung herunterladen
                </button>
              </div>

              {/* Kategorien */}
              <div className="space-y-8">
                {evaluation.kategorien.map((kategorie: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Kategorie Header mit Feedback-Button */}
                    <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-800">{kategorie.name}</h3>
                      <button
                        onClick={() => openFeedbackModal(kategorie)}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        title="Feedback zu diesem Abschnitt geben"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Feedback
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Graue Box - Kundeninhalt */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-3">Was der Kunde eingetragen hat:</h4>
                        <div className="text-sm text-gray-600 space-y-2">
                          {kategorie.kundeninhalt && typeof kategorie.kundeninhalt === 'object' && !Array.isArray(kategorie.kundeninhalt) ? (
                            Object.entries(kategorie.kundeninhalt).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-4 gap-3">
                                <span className="font-medium capitalize col-span-1">{key}:</span>
                                <span className="col-span-3">{typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value) || '-'}</span>
                              </div>
                            ))
                          ) : (
                            <p>{typeof kategorie.kundeninhalt === 'string' ? kategorie.kundeninhalt : 'Keine Einträge gefunden'}</p>
                          )}
                        </div>
                      </div>

                      {/* Blaue Box - Anforderungen mit Status-Icons */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-3">Anforderungen für diesen Bereich:</h4>
                        <ul className="text-sm text-blue-700 space-y-2">
                          {kategorie.anforderungen_status && kategorie.anforderungen_status.length > 0 ? (
                            kategorie.anforderungen_status.map((anforderung: any, reqIdx: number) => (
                              <li key={reqIdx} className="flex items-start">
                                <div className="mr-3 mt-0.5 flex-shrink-0">
                                  {getStatusIcon(anforderung.status)}
                                </div>
                                <span>{anforderung.text}</span>
                              </li>
                            ))
                          ) : (
                            (brandingRequirements[kategorie.name as keyof typeof brandingRequirements] || []).map((requirement, reqIdx) => (
                              <li key={reqIdx} className="flex items-start">
                                <span className="text-blue-500 mr-2 mt-1">•</span>
                                <span>{requirement}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      {/* Feedback - Problem Box (ROT) */}
                      {kategorie.feedback_typ === 'problem' && kategorie.feedback_text && (
                        <div 
                          className="border rounded-lg p-4 relative bg-red-50 border-red-200 mb-4"
                          onMouseEnter={() => setHoveredFeedback(`${idx}-problem`)}
                          onMouseLeave={() => setHoveredFeedback(null)}
                        >
                          {/* Copy Button */}
                          {hoveredFeedback === `${idx}-problem` && (
                            <button
                              onClick={() => copyFeedbackText(kategorie.feedback_text)}
                              className="absolute top-2 right-2 p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                              title="Text kopieren"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          
                          <div className="flex items-start">
                            <div className="rounded-full p-1 mr-3 mt-1 bg-red-100 text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium mb-2 text-red-800">
                                Problem
                              </h5>
                              <p className="text-sm text-red-700">
                                {kategorie.feedback_text}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Feedback - Hinweis Box (GELB) - nur wenn kein Problem vorhanden */}
                      {kategorie.feedback_typ === 'hinweis' && kategorie.feedback_text && (
                        <div 
                          className="border rounded-lg p-4 relative bg-yellow-50 border-yellow-200 mb-4"
                          onMouseEnter={() => setHoveredFeedback(`${idx}-hinweis-solo`)}
                          onMouseLeave={() => setHoveredFeedback(null)}
                        >
                          {/* Copy Button */}
                          {hoveredFeedback === `${idx}-hinweis-solo` && (
                            <button
                              onClick={() => copyFeedbackText(kategorie.feedback_text)}
                              className="absolute top-2 right-2 p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                              title="Text kopieren"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          
                          <div className="flex items-start">
                            <div className="rounded-full p-1 mr-3 mt-1 bg-yellow-100 text-yellow-600">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium mb-2 text-yellow-800">
                                Hinweis
                              </h5>
                              <p className="text-sm text-yellow-700">
                                {kategorie.feedback_text}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Zusätzliche Hinweis Box (bei neuem Format) */}
                      {kategorie.hinweis_feedback && kategorie.hinweis_feedback.text && (
                        <div 
                          className="border rounded-lg p-4 relative bg-yellow-50 border-yellow-200"
                          onMouseEnter={() => setHoveredFeedback(`${idx}-hinweis`)}
                          onMouseLeave={() => setHoveredFeedback(null)}
                        >
                          {/* Copy Button */}
                          {hoveredFeedback === `${idx}-hinweis` && (
                            <button
                              onClick={() => copyFeedbackText(kategorie.hinweis_feedback.text)}
                              className="absolute top-2 right-2 p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                              title="Text kopieren"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          
                          <div className="flex items-start">
                            <div className="rounded-full p-1 mr-3 mt-1 bg-yellow-100 text-yellow-600">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium mb-2 text-yellow-800">
                                Hinweis
                              </h5>
                              <p className="text-sm text-yellow-700">
                                {kategorie.hinweis_feedback.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {feedbackModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Feedback für: {feedbackModal.kategorie?.name}
                    </h2>
                    <button
                      onClick={closeFeedbackModal}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-700 mb-2">Aktueller Kundeninhalt:</h3>
                      <div className="text-sm text-gray-600">
                        {feedbackModal.kategorie && typeof feedbackModal.kategorie.kundeninhalt === 'object' && !Array.isArray(feedbackModal.kategorie.kundeninhalt) ? (
                          Object.entries(feedbackModal.kategorie.kundeninhalt).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-4 gap-3 mb-1">
                              <span className="font-medium capitalize col-span-1">{key}:</span>
                              <span className="col-span-3">{typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value) || '-'}</span>
                            </div>
                          ))
                        ) : (
                          <p>{typeof feedbackModal.kategorie?.kundeninhalt === 'string' ? feedbackModal.kategorie.kundeninhalt : 'Keine Einträge gefunden'}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Aktuelle Bewertung:</h3>
                      <div className="text-sm">
                        {feedbackModal.kategorie?.anforderungen_status && feedbackModal.kategorie.anforderungen_status.length > 0 ? (
                          <ul className="space-y-1">
                            {feedbackModal.kategorie.anforderungen_status.map((req: any, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <div className="mr-2 mt-0.5">
                                  {getStatusIcon(req.status)}
                                </div>
                                <span className="text-blue-700">{req.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-blue-700">Keine Bewertungsinformationen verfügbar</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ihr Feedback / Korrekturen:
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Beschreiben Sie hier, was an der Bewertung korrigiert werden soll. Z.B.:
- Die Anforderung XY sollte anders formuliert werden
- Status von ABC sollte 'erfüllt' statt 'problem' sein
- Neue Anforderung hinzufügen: ..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeFeedbackModal}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={copyFeedbackToClipboard}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={!feedbackText.trim()}
                      >
                        In Zwischenablage kopieren
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
            <h3 className="font-semibold text-gray-800 mb-2">Bewertungslogik:</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Graue Box:</strong> Zeigt, was der Kunde eingetragen hat</p>
              <p><strong>Blaue Box:</strong> Listet alle Anforderungen für den Bereich auf</p>
              <p><strong>Gelbe Box:</strong> Hinweis - Anforderung fast erfüllt, kann noch optimiert werden</p>
              <p><strong>Rote Box:</strong> Problem - Anforderung fehlt oder wird nicht erfüllt</p>
              <p><strong>Kein Feedback:</strong> Alle Anforderungen sind erfüllt ✅</p>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Icon-Bedeutung in den Anforderungsboxen:</h4>
              <div className="flex items-center space-x-6 text-sm text-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  <span>Erfüllt</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mr-1" />
                  <span>Warnung</span>
                </div>
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-600 mr-1" />
                  <span>Problem</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Die 7 Branding-Kategorien:</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <ul className="space-y-1">
                    <li>• Zielgruppe (demografisch)</li>
                    <li>• Zielgruppe (Lifestyle)</li>
                    <li>• Die Hochzeit der Zielgruppe</li>
                    <li>• Moodboard der Hochzeit</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-1">
                    <li>• Dein Angebot</li>
                    <li>• Leistungen & Preise</li>
                    <li>• Visuelles Branding</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-xs mt-3">
              Das Tool ignoriert automatisch die gelbe Spalte (Beispieltexte) und bewertet nur Ihre ausgefüllten Inhalte. 
              <strong> NEU: Preisbewertung basierend auf aktuellen Marktpreisen!</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingKitEvaluator;
