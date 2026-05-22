import React, { useState, useEffect } from "react";

const CityInput = ({ label, icon, value, onChange, placeholder, required }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState(value);
  const [isSelected, setIsSelected] = useState(false); // Nouveau flag

  useEffect(() => {
    // Si on vient de sélectionner, ou si c'est trop court, on ne cherche pas
    if (isSelected || query.length < 3) {
      setSuggestions([]);
      if (isSelected) setIsSelected(false); // Reset pour la prochaine frappe
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5`,
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="relative space-y-2">
      <label className="text-slate-400 text-sm font-medium flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        required={required}
        type="text"
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-[100] w-full bg-slate-800 border border-slate-700 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsSelected(true); // On bloque la recherche automatique
                setQuery(s.display_name);
                onChange(s.display_name);
                setSuggestions([]);
              }}
              className="px-4 py-3 hover:bg-blue-600 cursor-pointer text-sm text-white border-b border-slate-700 last:border-0"
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityInput;
