import React, { useEffect, useRef } from "react";

const LogGrid = ({ dayEvents, date }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Config de la grille
    const margin = { top: 40, right: 30, bottom: 20, left: 100 };
    const gridWidth = width - margin.left - margin.right;
    const rowHeight = 40;
    const statusY = { OFF_DUTY: 0, SLEEPER: 1, DRIVING: 2, ON_DUTY: 3 };

    // Nettoyage
    ctx.clearRect(0, 0, width, height);

    // 1. Dessiner le cadre et les lignes de statut
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = margin.top + i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + gridWidth, y);
      ctx.stroke();
    }

    // 2. Dessiner les labels de statut
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px sans-serif";
    Object.keys(statusY).forEach((status, i) => {
      ctx.fillText(
        status.replace("_", " "),
        10,
        margin.top + i * rowHeight + 25,
      );
    });

    // 3. Dessiner les heures (0 à 24)
    for (let h = 0; h <= 24; h++) {
      const x = margin.left + (h * gridWidth) / 24;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + 4 * rowHeight);
      ctx.stroke();
      if (h % 2 === 0) {
        ctx.fillText(h === 12 ? "M" : h, x - 5, margin.top - 10);
      }
    }

    // 4. Tracer la ligne de log (en rouge épais)
    ctx.beginPath();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";

    let lastY = null;

    dayEvents.forEach((event, index) => {
      // On utilise les dates découpées par le helper
      const start = event.drawStart;
      const end = event.drawEnd;

      // Calcul du pourcentage de la journée (0 à 1)
      // On calcule les minutes écoulées depuis MINUIT de ce jour précis
      const getDayMinutes = (date) =>
        date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

      const startMin = getDayMinutes(start);
      const endMin = getDayMinutes(end);

      const xStart = margin.left + (startMin / 1440) * gridWidth;
      const xEnd = margin.left + (endMin / 1440) * gridWidth;
      const y = margin.top + statusY[event.status] * rowHeight + rowHeight / 2;

      // Si c'est le premier point du jour, on place le pinceau
      if (index === 0) {
        ctx.moveTo(xStart, y);
      }

      // Si le statut a changé par rapport à l'événement précédent, ligne verticale
      if (lastY !== null && lastY !== y) {
        ctx.lineTo(xStart, lastY);
        ctx.lineTo(xStart, y);
      }

      ctx.lineTo(xEnd, y);
      lastY = y;
    });

    ctx.stroke();
  }, [dayEvents]);

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 my-4 shadow-inner">
      <div className="flex justify-between mb-4">
        <h4 className="text-blue-400 font-bold uppercase tracking-wider">
          Daily Log: {date}
        </h4>
        <span className="text-slate-500 text-sm">
          Property-Carrying Driver (70hr/8day)
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 text-[10px] uppercase font-mono text-slate-400">
        <div className="border-b border-slate-700">
          <span className="block text-[8px]">Carrier:</span>
          <span className="text-white">Spotter Logistics</span>
        </div>
        <div className="border-b border-slate-700">
          <span className="block text-[8px]">Main Office:</span>
          <span className="text-white">Washington, D.C.</span>
        </div>
        <div className="border-b border-slate-700">
          <span className="block text-[8px]">Truck ID:</span>
          <span className="text-white">T-2024-X</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width="850"
        height="220"
        className="w-full h-auto"
      />
    </div>
  );
};

export default LogGrid;
