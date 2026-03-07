import React, { useState } from "react";
import { Grid } from "./Grid";
import { Button } from "./ui/Button";
import { useLanguage } from "../context/LanguageContext";
import { SHIPS_CONFIG, GRID_SIZE } from "../lib/constants";
import { RotateCw, Shuffle, Play } from "lucide-react";
import { cn } from "../lib/utils";

export const ShipPlacement = ({ onComplete }) => {
  const { t } = useLanguage();
  const [placedShips, setPlacedShips] = useState([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState("horizontal");

  const currentShip = SHIPS_CONFIG.flatMap(s => Array(s.count).fill(s))[currentShipIndex];

  const handleCellClick = (x, y) => {
    if (!currentShip) return;
    const newShip = { id: `ship-${currentShipIndex}`, size: currentShip.size, x, y, orientation, cells: [] };
    for (let i = 0; i < currentShip.size; i++) {
      const cellX = orientation === "horizontal" ? x + i : x;
      const cellY = orientation === "vertical" ? y + i : y;
      if (cellX >= GRID_SIZE || cellY >= GRID_SIZE) return;
      if (placedShips.some(s => s.cells.some(c => c.x === cellX && c.y === cellY))) return;
      newShip.cells.push({ x: cellX, y: cellY });
    }
    setPlacedShips([...placedShips, newShip]);
    setCurrentShipIndex(currentShipIndex + 1);
  };

  const randomize = () => {
    const allShips = SHIPS_CONFIG.flatMap(s => Array(s.count).fill(s));
    const newPlaced = [];
    allShips.forEach((ship, idx) => {
      let placed = false;
      while (!placed) {
        const orient = Math.random() > 0.5 ? "horizontal" : "vertical";
        const x = Math.floor(Math.random() * (orient === "horizontal" ? GRID_SIZE - ship.size : GRID_SIZE));
        const y = Math.floor(Math.random() * (orient === "vertical" ? GRID_SIZE - ship.size : GRID_SIZE));
        const cells = [];
        let overlap = false;
        for (let i = 0; i < ship.size; i++) {
          const cx = orient === "horizontal" ? x + i : x;
          const cy = orient === "vertical" ? y + i : y;
          if (newPlaced.some(s => s.cells.some(c => c.x === cx && c.y === cy))) { overlap = true; break; }
          cells.push({ x: cx, y: cy });
        }
        if (!overlap) { newPlaced.push({ id: `ship-${idx}`, size: ship.size, x, y, orientation: orient, cells }); placed = true; }
      }
    });
    setPlacedShips(newPlaced);
    setCurrentShipIndex(allShips.length);
  };

  const reset = () => { setPlacedShips([]); setCurrentShipIndex(0); };
  const cells = placedShips.flatMap(s => s.cells.map(c => ({ ...c, shipId: s.id })));

  return (
    <div className="flex flex-col items-center gap-12 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-blue-400 marker-font tracking-tight drop-shadow-lg">{t("placeShips")}</h2>
        <p className="text-blue-200/60 text-lg max-w-md mx-auto Architects Daughter italic font-bold">
          {lang === "he" ? "הצב את הצי שלך בעמדות קרב או תן למזל להחליט." : "Position your fleet for battle or let luck decide."}
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-start justify-center w-full">
        <div className="relative group">
          <div className="absolute -inset-4 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <Grid 
            cells={cells} 
            onCellClick={handleCellClick} 
            showShips 
            active={!!currentShip} 
            rotation={-0.5}
            className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10"
          />
        </div>
        
        <div className="flex flex-col gap-6 bg-slate-900/60 p-8 rounded-3xl border border-white/10 backdrop-blur-xl w-80 shadow-2xl">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div className="flex flex-col">
              <span className="text-xs text-blue-400 uppercase tracking-widest font-bold marker-font">{t("ships")}</span>
              <span className="text-2xl font-black text-white marker-font">{placedShips.length} <span className="text-sm text-white/40">/ 13</span></span>
            </div>
            <Button 
              size="icon" 
              variant="outline" 
              className="rounded-full w-12 h-12 border-blue-500/50 hover:bg-blue-500/20"
              onClick={() => setOrientation(prev => prev === "horizontal" ? "vertical" : "horizontal")}
            >
              <RotateCw className={cn("transition-transform duration-500", orientation === "vertical" ? "rotate-90" : "")} size={24} />
            </Button>
          </div>

          <div className="space-y-3 py-2">
            {SHIPS_CONFIG.map(s => {
              const count = placedShips.filter(ps => ps.size === s.size).length;
              const isDone = count >= s.count;
              return (
                <div key={s.name} className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                  isDone ? "bg-green-500/10 border-green-500/30 opacity-50" : "bg-white/5 border-white/10"
                )}>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-wide">{s.name}</span>
                    <div className="flex gap-1 mt-1">
                      {Array.from({length: s.size}).map((_, i) => (
                        <div key={i} className="w-3 h-2 bg-blue-400/40 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-black marker-font text-blue-300">{count}/{s.count}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={randomize} className="flex gap-2 rounded-xl py-6 border-white/20 hover:bg-white/10">
                <Shuffle size={16} /> {t("randomize")}
              </Button>
              <Button variant="outline" size="sm" onClick={reset} className="flex gap-2 rounded-xl py-6 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                {t("reset")}
              </Button>
            </div>
            
            {placedShips.length === 13 && (
              <Button 
                className="mt-2 flex gap-3 py-8 text-xl font-black marker-font rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-transform shadow-lg shadow-blue-500/20" 
                onClick={() => onComplete(placedShips)}
              >
                <Play size={24} fill="currentColor" /> {t("start")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
