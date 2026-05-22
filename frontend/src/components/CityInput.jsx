import React, { useState, useEffect } from "react";

const CityInput = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  required,
  darkMode,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState(value);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (isSelected || query.length < 3) {
      setSuggestions([]);
      if (isSelected) setIsSelected(false);
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

  // Détermine si le label doit rester en haut (si l'input n'est pas vide)
  const isInputActive = query.length > 0;

  return (
    <div className="relative w-full group">
      {/* Icône à droite */}
      <div
        className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors 
        ${darkMode ? "text-slate-500" : "text-slate-400"}`}
      >
        {icon}
      </div>

      <input
        required={required}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        placeholder=" " // Important pour que peer-focus fonctionne
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
            isInputActive
              ? "top-1 text-[9px] text-blue-500 font-bold uppercase"
              : `top-1/2 -translate-y-1/2 text-xs peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-[9px] peer-focus:text-blue-500 peer-focus:font-bold peer-focus:uppercase ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`
          }`}
      >
        {label}
      </label>

      {/* Liste des suggestions */}
      {suggestions.length > 0 && (
        <ul
          className={`absolute z-[100] w-full mt-1 border rounded-sm shadow-xl max-h-48 overflow-y-auto 
          ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsSelected(true);
                setQuery(s.display_name);
                onChange(s.display_name);
                setSuggestions([]);
              }}
              className={`px-3 py-2 cursor-pointer text-[10px] border-b last:border-0 transition-colors
                ${
                  darkMode
                    ? "text-slate-300 border-slate-800 hover:bg-blue-900/20 hover:text-blue-400"
                    : "text-slate-700 border-slate-100 hover:bg-blue-50 hover:text-blue-600"
                }`}
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
