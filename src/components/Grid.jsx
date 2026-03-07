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
    <div className={cn("inline-block bg-white p-4 rounded-xl border border-slate-200 shadow-sm", className)}>
      <div className="grid grid-cols-11 gap-1">
        {/* Corner */}
        <div className="w-8 h-8 md:w-10 md:h-10"></div>
        
        {/* Column Headers */}
        {letters.map((char) => (
          <div key={char} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-xs font-medium text-slate-400">
            {char}
          </div>
        ))}
        
        {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* Row Header */}
            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-xs font-medium text-slate-400">
              {rowIndex + 1}
            </div>
            
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
                    "w-8 h-8 md:w-10 md:h-10 border border-slate-200 rounded-sm transition-colors relative flex items-center justify-center",
                    !isHit && !isMiss && active && "hover:bg-slate-100 cursor-pointer",
                    !active && !isHit && !isMiss && "bg-slate-50/50 cursor-default",
                    hasShip && !isHit && !isMiss && "bg-blue-100 border-blue-300",
                    isMiss && "bg-slate-100",
                    isHit && "bg-red-50 border-red-200"
                  )}
                >
                  {isMiss && <div className="w-2 h-2 rounded-full bg-slate-300" />}
                  {isHit && <div className="w-3 h-3 rounded-full bg-red-500" />}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
