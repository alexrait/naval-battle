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
    <div className={cn("inline-block bg-white p-2 md:p-4 rounded-xl border border-slate-200 shadow-sm max-w-full", className)}>
      <div className="grid grid-cols-11 gap-[2px] md:gap-1">
        {/* Corner */}
        <div className="w-[clamp(1.2rem,5vw,2.5rem)] h-[clamp(1.2rem,5vw,2.5rem)]"></div>
        
        {/* Column Headers */}
        {letters.map((char) => (
          <div key={char} className="w-[clamp(1.2rem,5vw,2.5rem)] h-[clamp(1.2rem,5vw,2.5rem)] flex items-center justify-center text-[clamp(0.55rem,1.8vw,0.75rem)] font-medium text-slate-400">
            {char}
          </div>
        ))}
        
        {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* Row Header */}
            <div className="w-[clamp(1.2rem,5vw,2.5rem)] h-[clamp(1.2rem,5vw,2.5rem)] flex items-center justify-center text-[clamp(0.55rem,1.8vw,0.75rem)] font-medium text-slate-400">
              {rowIndex + 1}
            </div>
            
            {/* Cells */}
            {Array.from({ length: GRID_SIZE }).map((_, colIndex) => {
              const cell = cells.find(c => c.x === colIndex && c.y === rowIndex);
              const isHit     = cell?.status === "hit";
              const isSunk    = cell?.status === "sunk";
              const isMiss    = cell?.status === "miss";
              const isBlocked = cell?.status === "blocked";
              const hasShip   = cell?.shipId && showShips;
              const isMarked  = isHit || isSunk;

              return (
                <button
                  key={`${colIndex}-${rowIndex}`}
                  disabled={!active || isMarked || isMiss || isBlocked}
                  onClick={() => onCellClick?.(colIndex, rowIndex)}
                  className={cn(
                    "w-[clamp(1.2rem,5vw,2.5rem)] h-[clamp(1.2rem,5vw,2.5rem)] border rounded-sm transition-colors relative flex items-center justify-center",
                    "border-slate-200",
                    !isMarked && !isMiss && !isBlocked && active  && "hover:bg-slate-100 cursor-pointer",
                    !active && !isMarked && !isMiss && !isBlocked && "bg-slate-50/50 cursor-default",
                    hasShip  && !isMarked && !isMiss && "bg-blue-100 border-blue-300",
                    isMiss   && "bg-slate-100",
                    isBlocked && "bg-slate-50 cursor-not-allowed opacity-60",
                    // hit: just light red + X, no thick border
                    isHit  && "bg-red-50 border-red-200",
                    // sunk: darker red + thick border on ALL sunk cells of the ship
                    isSunk && "bg-red-100 border-red-500 border-2"
                  )}
                >
                  {isMiss && (
                    <div className="w-[clamp(0.3rem,1.5vw,0.5rem)] h-[clamp(0.3rem,1.5vw,0.5rem)] rounded-full bg-slate-300" />
                  )}
                  {(isHit || isSunk) && (
                    <svg
                      viewBox="0 0 10 10"
                      className="w-[clamp(0.6rem,2.5vw,1rem)] h-[clamp(0.6rem,2.5vw,1rem)]"
                      fill="none"
                      strokeLinecap="round"
                    >
                      <line x1="1" y1="1" x2="9" y2="9" stroke={isSunk ? "#dc2626" : "#ef4444"} strokeWidth="2.5" />
                      <line x1="9" y1="1" x2="1" y2="9" stroke={isSunk ? "#dc2626" : "#ef4444"} strokeWidth="2.5" />
                    </svg>
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
