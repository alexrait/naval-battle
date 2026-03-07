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
    <div className={cn("paper-board p-4 rounded-sm border-2 border-slate-300", className)}>
      <div className="grid grid-cols-11 gap-0">
        <div className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 font-bold">#</div>
        {letters.map((char) => (
          <div key={char} className="w-8 h-8 flex items-center justify-center text-sm text-slate-800 font-bold">{char}</div>
        ))}
        {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <div className="w-8 h-8 flex items-center justify-center text-sm text-slate-800 font-bold border-r border-slate-200">{rowIndex + 1}</div>
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
                    "w-8 h-8 border-b border-r border-slate-200 transition-all duration-200 relative group overflow-hidden",
                    !isHit && !isMiss && active && "hover:bg-slate-200/50 cursor-crosshair",
                    hasShip && !isHit && !isMiss && "bg-slate-300/30"
                  )}
                >
                  {hasShip && !isHit && !isMiss && (
                    <div className="absolute inset-1 hand-drawn-ship bg-slate-400/20" />
                  )}
                  {isMiss && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="hand-drawn-circle border-blue-900" />
                    </div>
                  )}
                  {isHit && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-600 hand-drawn-x text-2xl drop-shadow-sm">
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
