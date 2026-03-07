import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { GRID_SIZE, HEBREW_LETTERS, ENGLISH_LETTERS } from "../lib/constants";
import { cn } from "../lib/utils";

export const Grid = ({ 
  cells = [], 
  onCellClick, 
  showShips = false, 
  active = true,
  className,
  rotation = -0.5
}) => {
  const { lang } = useLanguage();
  const letters = lang === "he" ? HEBREW_LETTERS : ENGLISH_LETTERS;

  return (
    <div 
      className={cn("paper-board p-6 rounded-sm border border-slate-300", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="grid grid-cols-11 gap-0">
        {/* Corner */}
        <div className="w-10 h-10 flex items-center justify-center text-xs text-slate-400 font-bold">#</div>
        
        {/* Column Headers */}
        {letters.map((char) => (
          <div key={char} className="w-10 h-10 flex items-center justify-center text-lg text-slate-800 font-bold marker-font">{char}</div>
        ))}
        
        {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* Row Header */}
            <div className="w-10 h-10 flex items-center justify-center text-lg text-slate-800 font-bold border-r border-slate-200 marker-font">{rowIndex + 1}</div>
            
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
                    "w-10 h-10 border-b border-r border-slate-200 transition-all duration-200 relative group overflow-hidden",
                    !isHit && !isMiss && active && "hover:bg-blue-400/10 cursor-crosshair",
                    hasShip && !isHit && !isMiss && "bg-slate-300/20"
                  )}
                >
                  {hasShip && !isHit && !isMiss && (
                    <div className="absolute inset-1.5 hand-drawn-ship" />
                  )}
                  {isMiss && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="hand-drawn-circle border-blue-900" />
                    </div>
                  )}
                  {isHit && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-600 hand-drawn-x text-3xl font-black drop-shadow-sm">
                      X
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
