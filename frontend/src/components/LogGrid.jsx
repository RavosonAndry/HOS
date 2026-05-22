import React, { useEffect, useRef } from "react";

const LogGrid = ({ dayEvents, date, darkMode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // On utilise un ratio pour la netteté sur écrans Retina
    const width = 800;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Couleurs selon le thème
    const gridColor = darkMode ? "#334155" : "#cbd5e1"; // Plus sombre en light pour être net
    const textColor = darkMode ? "#94a3b8" : "#475569";
    const logColor = "#2563eb"; // Bleu ELD pro

    const bgColor = darkMode ? "#0f172a" : "#ffffff"; // HEX PUR
    const subGridColor = darkMode ? "#1e293b" : "#f1f5f9"; // Pour le zebra striping

    const margin = { top: 40, right: 30, bottom: 20, left: 100 };
    const gridWidth = width - margin.left - margin.right;
    const rowHeight = 35;
    const statusY = { OFF_DUTY: 0, SLEEPER: 1, DRIVING: 2, ON_DUTY: 3 };

    // 1. Fond du Canvas (Effet Papier en Light Mode)
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Dessiner le "Zebra Striping" (alternance de couleur de fond pour les lignes)
    Object.keys(statusY).forEach((status, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = darkMode ? "#161e2e" : "#f8fafc";
        ctx.fillRect(
          margin.left,
          margin.top + i * rowHeight,
          gridWidth,
          rowHeight,
        );
      }
    });

    // 3. Dessiner la grille horizontale
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = margin.top + i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + gridWidth, y);
      ctx.stroke();
    }

    // 4. Labels Statuts (Texte à gauche)
    ctx.fillStyle = darkMode ? "#f8fafc" : "#0f172a"; // Très contrasté
    ctx.font = "bold 9px 'Inter', sans-serif";
    Object.keys(statusY).forEach((status, i) => {
      ctx.fillText(
        status.replace("_", " "),
        10,
        margin.top + i * rowHeight + 20,
      );
    });

    // 5. Graduations des heures et demi-heures
    for (let h = 0; h <= 24; h++) {
      const x = margin.left + (h * gridWidth) / 24;

      // Ligne verticale principale
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + 4 * rowHeight);
      ctx.stroke();

      // Heures (Texte)
      ctx.fillStyle = textColor;
      if (h % 2 === 0) {
        ctx.font = "600 9px 'Inter', sans-serif";
        ctx.fillText(h === 12 ? "M" : h, x - 4, margin.top - 12);
      }

      // Petite graduation pour la demi-heure (30 min)
      if (h < 24) {
        const xHalf = x + gridWidth / 24 / 2;
        ctx.strokeStyle = darkMode ? "#1e293b" : "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(xHalf, margin.top);
        ctx.lineTo(xHalf, margin.top + 4 * rowHeight);
        ctx.stroke();
      }
    }

    // 6. Tracer la ligne de log (le trajet)
    ctx.beginPath();
    ctx.strokeStyle = logColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    let lastY = null;
    dayEvents.forEach((event, index) => {
      const start = event.drawStart;
      const end = event.drawEnd;

      const getDayMinutes = (d) => d.getHours() * 60 + d.getMinutes();
      const xStart = margin.left + (getDayMinutes(start) / 1440) * gridWidth;
      const xEnd = margin.left + (getDayMinutes(end) / 1440) * gridWidth;
      const y = margin.top + statusY[event.status] * rowHeight + rowHeight / 2;

      if (index === 0) ctx.moveTo(xStart, y);
      if (lastY !== null && lastY !== y) {
        ctx.lineTo(xStart, lastY); // Ligne verticale de changement de statut
        ctx.lineTo(xStart, y);
      }
      ctx.lineTo(xEnd, y);
      lastY = y;
    });
    ctx.stroke();

    // Petit cercle à la fin pour le style premium
    if (dayEvents.length > 0) {
      const lastEvent = dayEvents[dayEvents.length - 1];
      const endMin =
        lastEvent.drawEnd.getHours() * 60 + lastEvent.drawEnd.getMinutes();
      const xEnd = margin.left + (endMin / 1440) * gridWidth;
      const yEnd =
        margin.top + statusY[lastEvent.status] * rowHeight + rowHeight / 2;
      ctx.fillStyle = logColor;
      ctx.beginPath();
      ctx.arc(xEnd, yEnd, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [dayEvents, darkMode]);

  return (
    <div className="w-full">
      {/* Header du Log - Info Conducteur */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <h4
              className={`font-black uppercase tracking-widest text-[11px] ${darkMode ? "text-white" : "text-slate-950"}`}
            >
              Daily Log : {date}
            </h4>
          </div>
          <p
            className={`text-[9px] font-bold uppercase tracking-tighter ${darkMode ? "text-slate-500" : "text-slate-400"}`}
          >
            Federal Motor Carrier Safety Regulations (HOS)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[8px] uppercase font-bold">
          {[
            { label: "Truck ID", val: "T-2024-X" },
            { label: "Carrier", val: "Spotter Log" },
            { label: "Office", val: "Wash, DC" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-2 border rounded-sm transition-colors ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
            >
              <span
                className={`block opacity-60 mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                {item.label}
              </span>
              <span className={darkMode ? "text-white" : "text-slate-950"}>
                {item.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Le Graphique (Scrollable sur Mobile) */}
      <div className="overflow-x-auto pb-4 cursor-default no-scrollbar">
        <div
          className={`inline-block p-1 rounded-sm ${!darkMode ? "bg-slate-200" : "bg-slate-800"}`}
        >
          <canvas
            ref={canvasRef}
            className="block h-auto min-w-[750px] rounded-sm shadow-inner"
            style={{ width: "800px", height: "200px" }}
          />
        </div>
      </div>

      {/* Footer du log avec total heures (Optionnel mais Premium) */}
      <div className="mt-2 flex justify-end gap-6 text-[9px] font-bold uppercase opacity-60">
        <div className={darkMode ? "text-slate-400" : "text-slate-600"}>
          Total Distance:{" "}
          <span className={darkMode ? "text-white" : "text-slate-950"}>
            --- mi
          </span>
        </div>
        <div className={darkMode ? "text-slate-400" : "text-slate-600"}>
          Total Hours:{" "}
          <span className={darkMode ? "text-white" : "text-slate-950"}>
            24.0h
          </span>
        </div>
      </div>
    </div>
  );
};

export default LogGrid;
