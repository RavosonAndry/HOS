import React, { useState } from "react";
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  PlayCircle,
  Loader2,
} from "lucide-react";
import CityInput from "./CityInput";

const TripForm = ({ onTripGenerated, darkMode }) => {
  const [formData, setFormData] = useState({
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    currentCycleUsed: 0,
  });
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.PROD ? "" : "http://localhost:8000";
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-trip/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Erreur");
      const data = await response.json();
      onTripGenerated(data);
    } catch (error) {
      alert("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const isCycleInputActive = formData.currentCycleUsed > 0;

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col lg:flex-row items-stretch gap-2"
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <CityInput
            label="Position Actuelle"
            icon={<Navigation size={14} />}
            value={formData.currentLocation}
            onChange={(val) =>
              setFormData({ ...formData, currentLocation: val })
            }
            required
            darkMode={darkMode}
          />
          <CityInput
            label="Chargement"
            icon={<MapPin size={14} className="text-emerald-500" />}
            value={formData.pickupLocation}
            onChange={(val) =>
              setFormData({ ...formData, pickupLocation: val })
            }
            required
            darkMode={darkMode}
          />
          <CityInput
            label="Livraison"
            icon={<MapPin size={14} className="text-red-500" />}
            value={formData.dropoffLocation}
            onChange={(val) =>
              setFormData({ ...formData, dropoffLocation: val })
            }
            required
            darkMode={darkMode}
          />

          {/* Cycle Input - Mode Light/Dark Fixé */}
          <div className="relative group">
            <div className="absolute right-9 top-1/2 -translate-y-1/2 text-[9px] font-mono opacity-40 pointer-events-none">
              / 70.0h
            </div>
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
            >
              <Clock size={14} />
            </div>
            <input
              required
              type="number"
              min="0"
              max="70"
              step="0.1"
              value={formData.currentCycleUsed || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentCycleUsed:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
                })
              }
              placeholder=" "
              className={`peer w-full border rounded-sm px-3 pr-12 pt-4 pb-1 text-xs outline-none transition-all 
                ${
                  darkMode
                    ? "bg-slate-800/40 border-slate-700 text-white focus:border-blue-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400 focus:bg-white"
                }`}
            />
            <label
              className={`absolute left-3 transition-all duration-200 pointer-events-none
                ${
                  isCycleInputActive
                    ? "top-1 text-[9px] text-blue-500 font-bold uppercase"
                    : `top-1/2 -translate-y-1/2 text-xs peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-[9px] peer-focus:text-blue-500 peer-focus:font-bold peer-focus:uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`
                }`}
            >
              Cycle utilisé
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`lg:w-40 px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 
            ${
              loading
                ? "bg-slate-200 text-slate-400"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95"
            }`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <PlayCircle size={16} />
              <span>Générer</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TripForm;
