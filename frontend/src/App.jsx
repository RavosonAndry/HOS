import React, { useState, useEffect } from "react";
import TripForm from "./components/TripForm";
import MapDisplay from "./components/MapDisplay";
import LogGrid from "./components/LogGrid";
import "leaflet/dist/leaflet.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, Moon, Sun } from "lucide-react";

function App() {
  const [data, setData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

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
    console.log("Isolation des logs pour export PDF...");
    const pdf = new jsPDF("p", "mm", "a4");
    const logs = document.querySelectorAll(".log-sheet");

    if (logs.length === 0) return;

    for (let i = 0; i < logs.length; i++) {
      const canvas = await html2canvas(logs[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        onclone: (clonedDoc) => {
          // 1. SUPPRESSION RADICALE : On retire toutes les balises <style> et <link>
          // qui contiennent le CSS de Tailwind 4 pour éviter les erreurs oklab/oklch
          const styles = clonedDoc.querySelectorAll(
            "style, link[rel='stylesheet']",
          );
          styles.forEach((s) => s.remove());

          // 2. INJECTION D'UN CSS "SAFE" : On recrée un style minimaliste en HEX pur
          const safeStyle = clonedDoc.createElement("style");
          safeStyle.innerHTML = `
          .log-sheet { 
            background-color: #0f172a !important; 
            color: #ffffff !important; 
            font-family: Arial, sans-serif !important;
            padding: 20px !important;
          }
          .log-sheet * { 
            border-color: #334155 !important; 
            color: inherit !important;
            box-shadow: none !important;
            background-image: none !important;
          }
          h4 { color: #60a5fa !important; font-size: 16px !important; margin-bottom: 10px !important; }
          span { color: #94a3b8 !important; font-size: 10px !important; }
          .grid { display: flex !important; gap: 10px !important; }
          .border-b { border-bottom: 1px solid #334155 !important; }
        `;
          clonedDoc.head.appendChild(safeStyle);

          // 3. NETTOYAGE DES ATTRIBUTS : On enlève les classes qui pourraient porter des styles inline oklch
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let el of allElements) {
            el.removeAttribute("class"); // On enlève les classes Tailwind qui font planter
            // On garde juste les IDs ou on remet la classe log-sheet pour notre CSS safe
            if (el.id === logs[i].id || i === i) {
              /* optionnel */
            }
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage();
      // Ajustement pour que ça tienne bien sur une page A4
      pdf.addImage(imgData, "PNG", 5, 10, 200, 110);
    }

    pdf.save("Spotter-ELD-Final-Report.pdf");
    console.log("Export réussi !");
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-sm font-bold flex items-center gap-2 text-[10px] uppercase tracking-wider transition-transform active:scale-95"
              >
                <Download size={14} />{" "}
                <span className="hidden sm:inline">Export PDF</span>
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
