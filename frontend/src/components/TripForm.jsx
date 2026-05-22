import React, { useState } from "react";
import { Truck, MapPin, Navigation, Clock, PlayCircle } from "lucide-react";
import CityInput from "./CityInput"; // Import du nouveau composant

const TripForm = ({ onTripGenerated }) => {
  const [formData, setFormData] = useState({
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    currentCycleUsed: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connexion au backend Django
      const response = await fetch("http://localhost:8000/api/generate-trip/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Erreur serveur");

      const data = await response.json();
      onTripGenerated(data);
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      alert(
        "Erreur de connexion au serveur Django. Vérifiez que le backend est lancé.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40">
          <Truck className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Planificateur HOS
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest">
            Compliance FMCSA
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Position Actuelle avec Autocomplete */}
        <CityInput
          label="Position Actuelle"
          icon={<Navigation size={16} className="text-blue-400" />}
          placeholder="Ex: Chicago, IL"
          value={formData.currentLocation}
          onChange={(val) => setFormData({ ...formData, currentLocation: val })}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2. Pickup avec Autocomplete */}
          <CityInput
            label="Lieu de Chargement"
            icon={<MapPin size={16} className="text-emerald-500" />}
            placeholder="Ville de départ"
            value={formData.pickupLocation}
            onChange={(val) =>
              setFormData({ ...formData, pickupLocation: val })
            }
            required
          />

          {/* 3. Dropoff avec Autocomplete */}
          <CityInput
            label="Lieu de Livraison"
            icon={<MapPin size={16} className="text-red-500" />}
            placeholder="Destination"
            value={formData.dropoffLocation}
            onChange={(val) =>
              setFormData({ ...formData, dropoffLocation: val })
            }
            required
          />
        </div>

        {/* 4. Heures de Cycle (Standard) */}
        <div className="space-y-2">
          <label className="text-slate-400 text-sm font-medium flex items-center gap-2">
            <Clock size={16} /> Heures utilisées (Cycle 70h/8j)
          </label>
          <div className="relative">
            <input
              required
              type="number"
              min="0"
              max="70"
              step="0.1"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.currentCycleUsed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentCycleUsed:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
                })
              }
            />
            <span className="absolute right-4 top-3 text-slate-500 font-mono text-sm">
              / 70.0
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-4"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calcul de la route...</span>
            </div>
          ) : (
            <>
              <PlayCircle size={20} />
              Générer la Route et les Logs
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TripForm;
