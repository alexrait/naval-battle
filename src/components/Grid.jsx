import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { GRID_SIZE, HEBREW_LETTERS, ENGLISH_LETTERS } from "../lib/constants";
import { cn } from "../lib/utils";

export const Grid = ({ 
  cells = [], 
  onCellClick, 
  showShips = false, 
  active = true,
  className 
}) => {
  const { lang } = useLanguage();
  const letters = lang === "he" ? HEBREW_LETTERS : ENGLISH_LETTERS;

  return (
    <div className={cn("bg-slate-900/60 p-4 rounded-xl border border-blue-500/20 backdrop-blur-md shadow-2xl", className)}>
      <div className="grid grid-cols-11 gap-1">
        {/* Corner */}
        <div className="w-10 h-10 flex items-center justify-center text-[10px] text-blue-500/40 font-bold tactical-font">COORD</div>
        
        {/* Column Headers */}
        {letters.map((char) => (
          <div key={char} className="w-10 h-10 flex items-center justify-center text-xs text-blue-400 font-bold tactical-font">{char}</div>
        ))}
        
        {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* Row Header */}
            <div className="w-10 h-10 flex items-center justify-center text-xs text-blue-400 font-bold tactical-font border-r border-white/5">{rowIndex + 1}</div>
            
            {/* Cells */}
            {Array.from({ length: GRID_SIZE }).map((_, colIndex) => {
              const cell = cells.find(c => c.x === colIndex && c.y === rowIndex);
              const isHit = cell?.status === "hit";
              const isMiss = cell?.status === "miss";
              const hasShip = cell?.shipId && showShips;
              return (
                <button
                  key={`${colIndex}-${rowIndex}`}
                  disabled={!active || isHit || isMiss}
                  onClick={() => onCellClick?.(colIndex, rowIndex)}
                  className={cn(
                    "w-10 h-10 border border-white/5 transition-all duration-300 relative group overflow-hidden flex items-center justify-center",
                    !isHit && !isMiss && active && "hover:bg-blue-500/20 cursor-crosshair",
                    hasShip && !isHit && !isMiss && "bg-blue-600/20 border-blue-500/40"
                  )}
                >
                  {/* Subtle Grid dots */}
                  <div className="absolute w-0.5 h-0.5 bg-white/5 rounded-full" />
                  
                  {hasShip && !isHit && !isMiss && (
                    <div className="w-6 h-6 bg-blue-500 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  )}
                  {isMiss && (
                    <div className="w-2 h-2 bg-slate-500 rounded-full opacity-50" />
                  )}
                  {isHit && (
                    <div className="w-full h-full flex items-center justify-center hit-marker">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_#ef4444]" />
                    </div>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
