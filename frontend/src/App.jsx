import React, { useState, useEffect } from "react";
import TripForm from "./components/TripForm";
import MapDisplay from "./components/MapDisplay";
import LogGrid from "./components/LogGrid";
import "leaflet/dist/leaflet.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, Moon, Sun, Loader2, CheckCircle } from "lucide-react";

function App() {
  const [data, setData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  // Nouvel état pour l'animation du bouton
  // "idle" | "downloading" | "success"
  const [downloadStatus, setDownloadStatus] = useState("idle");

  // Gestion du thème
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  // Découpage des logs par jour (24h)
  const getLogsByDay = (events) => {
    const dayLogs = {};

    events.forEach((event) => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);

      let iter = new Date(start);
      // On boucle sur chaque jour que l'événement traverse
      while (iter <= end) {
        const dateStr = iter.toISOString().split("T")[0];
        if (!dayLogs[dateStr]) dayLogs[dateStr] = [];

        // Définir les bornes de la journée (00:00 et 23:59)
        const dayStart = new Date(dateStr + "T00:00:00");
        const dayEnd = new Date(dateStr + "T23:59:59.999");

        // Calculer l'intersection entre l'événement et cette journée
        const actualStart = start > dayStart ? start : dayStart;
        const actualEnd = end < dayEnd ? end : dayEnd;

        if (actualStart < actualEnd) {
          dayLogs[dateStr].push({
            ...event,
            // On utilise ces dates précises pour le dessin
            drawStart: actualStart,
            drawEnd: actualEnd,
          });
        }

        // Passer au jour suivant à minuit pile
        iter.setDate(iter.getDate() + 1);
        iter.setHours(0, 0, 0, 0);
      }
    });
    return dayLogs;
  };

  const downloadPDF = async () => {
    if (downloadStatus !== "idle") return; // Empêche le double clic

    setDownloadStatus("downloading");
    console.log("Démarrage du PDF...");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const logs = document.querySelectorAll(".log-sheet");

      if (logs.length === 0) {
        alert("Aucun log trouvé.");
        setDownloadStatus("idle");
        return;
      }

      for (let i = 0; i < logs.length; i++) {
        const canvas = await html2canvas(logs[i], {
          scale: 3, // Augmenté pour une netteté parfaite des lignes
          useCORS: true,
          backgroundColor: "#020617", // Slate 950
          onclone: (clonedDoc) => {
            // 1. Nettoyage total du CSS moderne
            const styles = clonedDoc.querySelectorAll(
              "style, link[rel='stylesheet']",
            );
            styles.forEach((s) => s.remove());

            // 2. Injection du design Premium "Safe"
            const safeStyle = clonedDoc.createElement("style");
            safeStyle.innerHTML = `
          .log-sheet { 
            background-color: #020617 !important; 
            color: #f8fafc !important; 
            font-family: 'Helvetica', 'Arial', sans-serif !important;
            padding: 40px !important;
            min-height: 1000px;
          }
          
          /* Header du Log */
          .log-sheet h4 { 
            color: #ffffff !important; 
            font-size: 22px !important; 
            font-weight: 900 !important;
            text-transform: uppercase !important;
            margin: 0 0 5px 0 !important;
            letter-spacing: -0.5px !important;
          }
          
          .log-sheet p { 
            color: #64748b !important; 
            font-size: 10px !important; 
            text-transform: uppercase !important;
            font-weight: 700 !important;
            margin-bottom: 30px !important;
          }

          /* Grille de Metadonnées (Truck, Carrier, Office) */
          .meta-grid { 
            display: table !important; 
            width: 100% !important; 
            border-spacing: 10px 0 !important;
            margin-bottom: 40px !important;
          }
          
          .meta-item { 
            display: table-cell !important;
            background: #0f172a !important;
            border: 1px solid #1e293b !important;
            padding: 12px !important;
            border-radius: 4px !important;
          }

          .meta-label { 
            display: block !important;
            color: #3b82f6 !important; /* Blue 500 */
            font-size: 8px !important;
            font-weight: 800 !important;
            margin-bottom: 4px !important;
            text-transform: uppercase !important;
          }

          .meta-value { 
            display: block !important;
            color: #ffffff !important;
            font-size: 12px !important;
            font-weight: 600 !important;
          }

          /* Le Canvas (Graphique) */
          canvas { 
            border: 2px solid #1e293b !important;
            border-radius: 8px !important;
            margin: 20px 0 !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
          }

          /* Footer Heures/Miles */
          .footer-info {
            margin-top: 30px !important;
            text-align: right !important;
            border-top: 1px solid #1e293b !important;
            padding-top: 15px !important;
          }
          
          .footer-val {
            color: #ffffff !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            margin-left: 20px !important;
          }
        `;
            clonedDoc.head.appendChild(safeStyle);

            // 3. Application manuelle des structures (car on a enlevé les classes Tailwind)
            // On cible les éléments par leur contenu ou position pour leur donner les classes "Safe"
            const logContainer = clonedDoc.querySelector(".log-sheet");

            // On recrée la grille de meta pour le PDF
            const metaSection = logContainer.querySelector(".grid-cols-3");
            if (metaSection) {
              metaSection.className = "meta-grid";
              const items = metaSection.querySelectorAll("div");
              items.forEach((div) => {
                div.className = "meta-item";
                const spans = div.querySelectorAll("span");
                if (spans[0]) spans[0].className = "meta-label";
                if (spans[1]) spans[1].className = "meta-value";
              });
            }
          },
        });

        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage();

        // On centre l'image sur la page A4
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 20, imgWidth, imgHeight);

        // Ajout d'un petit filigrane de sécurité (Optionnel, très pro)
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          "Certified Electronic Logging Device (ELD) Data - Spotter Compliance",
          10,
          285,
        );
      }

      pdf.save(`HOS_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      // Animation de succès
      setDownloadStatus("success");

      // Retour à l'état normal après 3 secondes
      setTimeout(() => setDownloadStatus("idle"), 3000);
    } catch (error) {
      console.error("Erreur PDF:", error);
      setDownloadStatus("idle");
    }
  };
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans antialiased text-[11px]`}
    >
      {/* Header FIXE */}
      <header
        className={`sticky top-0 z-[1000] border-b backdrop-blur-md ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1
              className={`text-lg font-black italic uppercase tracking-tighter ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              SPOTTER <span className="text-blue-500">ELD</span>
            </h1>
            <p
              className={`text-[9px] uppercase tracking-[0.3em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}
            >
              Log Generator Pro
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-sm transition-colors ${darkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-100 text-slate-600"}`}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {data && (
              <button
                onClick={downloadPDF}
                disabled={downloadStatus === "downloading"}
                className={`
        flex items-center gap-2 px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all duration-300
        ${
          downloadStatus === "downloading"
            ? "bg-slate-700 cursor-wait"
            : downloadStatus === "success"
              ? "bg-emerald-600"
              : "bg-blue-600 hover:bg-blue-700"
        }
        text-white shadow-lg active:scale-95
      `}
              >
                {downloadStatus === "idle" && (
                  <>
                    <Download size={14} />
                    <span className="hidden sm:inline">Export PDF</span>
                  </>
                )}

                {downloadStatus === "downloading" && (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Génération...</span>
                  </>
                )}

                {downloadStatus === "success" && (
                  <>
                    <CheckCircle size={14} />
                    <span>Téléchargé !</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section
          className={`p-4 rounded-sm border shadow-sm ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <TripForm onTripGenerated={setData} darkMode={darkMode} />
        </section>

        {data && (
          <div className="space-y-8">
            <section
              className={`rounded-sm overflow-hidden border shadow-xl ${darkMode ? "border-slate-800" : "border-slate-200"}`}
            >
              <MapDisplay route={data.route} events={data.events} />
            </section>

            <section className="space-y-4 pb-12">
              <div className="flex items-center gap-2">
                <div className="h-3 w-[3px] bg-blue-500"></div>
                <h2
                  className={`text-[11px] font-bold uppercase tracking-widest ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Daily Activity Logs
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {Object.entries(getLogsByDay(data.events)).map(
                  ([date, dayEvents]) => (
                    <div
                      key={date}
                      className={`log-sheet p-4 rounded-sm border shadow-sm ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    >
                      <LogGrid
                        date={date}
                        dayEvents={dayEvents}
                        darkMode={darkMode}
                      />
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
