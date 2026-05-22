import React, { useState } from "react";
import TripForm from "./components/TripForm";
import MapDisplay from "./components/MapDisplay";
import LogGrid from "./components/LogGrid";
import "leaflet/dist/leaflet.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

function App() {
  const [data, setData] = useState(null);

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
    console.log("Démarrage du PDF...");
    const pdf = new jsPDF("p", "mm", "a4");
    const logs = document.querySelectorAll(".log-sheet");

    if (logs.length === 0) {
      alert("Aucun log trouvé.");
      return;
    }

    for (let i = 0; i < logs.length; i++) {
      const canvas = await html2canvas(logs[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        // --- LOGIQUE DE NETTOYAGE TAILWIND 4 ---
        onclone: (clonedDoc) => {
          // On cherche tous les éléments dans la copie du document
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let el of allElements) {
            const computedStyle = window.getComputedStyle(el);
            // Si une couleur utilise oklch, on la force en transparent ou une couleur HEX
            if (computedStyle.color.includes("oklch"))
              el.style.color = "#f8fafc";
            if (computedStyle.backgroundColor.includes("oklch"))
              el.style.backgroundColor = "#0f172a";
            if (computedStyle.borderColor.includes("oklch"))
              el.style.borderColor = "#1e293b";

            // On supprime les ombres Tailwind 4 qui utilisent souvent oklch
            if (computedStyle.boxShadow.includes("oklch"))
              el.style.boxShadow = "none";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 5, 10, 200, 110);
    }

    pdf.save("ELD-Log-Report.pdf");
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent italic">
            SPOTTER ELD PRO
          </h1>
          <p className="text-slate-400">HOS Compliant Route & Log Generator</p>
        </div>
        <div className="flex gap-4 text-sm font-mono">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-blue-400">
            Django 5.0
          </span>
          <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-emerald-400">
            Tailwind 4
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne Gauche : Formulaire */}
        <div className="lg:col-span-4">
          <TripForm onTripGenerated={setData} />
        </div>

        {/* Colonne Droite : Résultats */}
        <div className="lg:col-span-8 space-y-8">
          {!data ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-12 text-slate-600">
              <p className="text-xl">En attente de données de trajet...</p>
              <p className="text-sm italic">
                Entrez un trajet à gauche pour générer les logs.
              </p>
            </div>
          ) : (
            <>
              {/* Bouton de téléchargement */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={downloadPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                  Télécharger les Logs (PDF)
                </button>
              </div>
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>{" "}
                  Trajet Planifié
                </h3>
                <MapDisplay route={data.route} events={data.events} />
              </section>

              <section className="space-y-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>{" "}
                  Journaux de bord (ELD Logs)
                </h3>
                <div className="mt-8 space-y-12">
                  {Object.entries(getLogsByDay(data.events)).map(
                    ([date, dayEvents]) => (
                      /* C'EST CETTE CLASSE CI-DESSOUS QUI EST INDISPENSABLE */
                      <div
                        key={date}
                        className="log-sheet bg-slate-900 p-4 rounded-2xl border border-slate-800"
                      >
                        <LogGrid date={date} dayEvents={dayEvents} />
                      </div>
                    ),
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
