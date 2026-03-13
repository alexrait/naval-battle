import React, { useState } from "react";
import { Grid } from "./Grid";
import { Button } from "./ui/Button";
import { useLanguage } from "../context/LanguageContext";
import { SHIPS_CONFIG, GRID_SIZE } from "../lib/constants";
import { RotateCw, Shuffle, Play } from "lucide-react";
import { cn } from "../lib/utils";

export const ShipPlacement = ({ onComplete }) => {
  const { t, lang } = useLanguage();
  const [placedShips, setPlacedShips] = useState([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState("horizontal");

  const currentShip = SHIPS_CONFIG.flatMap(s => Array(s.count).fill(s))[currentShipIndex];

  // Returns true if (cx, cy) is occupied by or adjacent (incl. diagonals) to any placed ship
  const isTouching = (cx, cy, placedList) =>
    placedList.some(s =>
      s.cells.some(c => Math.abs(c.x - cx) <= 1 && Math.abs(c.y - cy) <= 1)
    );

  const handleCellClick = (x, y) => {
    if (!currentShip) return;
    const newShip = { id: `ship-${currentShipIndex}`, size: currentShip.size, x, y, orientation, cells: [] };
    for (let i = 0; i < currentShip.size; i++) {
      const cellX = orientation === "horizontal" ? x + i : x;
      const cellY = orientation === "vertical" ? y + i : y;
      if (cellX >= GRID_SIZE || cellY >= GRID_SIZE) return;
      if (isTouching(cellX, cellY, placedShips)) return;
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
        let conflict = false;
        for (let i = 0; i < ship.size; i++) {
          const cx = orient === "horizontal" ? x + i : x;
          const cy = orient === "vertical" ? y + i : y;
          if (newPlaced.some(s => s.cells.some(c => Math.abs(c.x - cx) <= 1 && Math.abs(c.y - cy) <= 1))) { conflict = true; break; }
          cells.push({ x: cx, y: cy });
        }
        if (!conflict) { newPlaced.push({ id: `ship-${idx}`, size: ship.size, x, y, orientation: orient, cells }); placed = true; }
      }
    });
    setPlacedShips(newPlaced);
    setCurrentShipIndex(allShips.length);
  };

  const reset = () => { setPlacedShips([]); setCurrentShipIndex(0); };
  const cells = placedShips.flatMap(s => s.cells.map(c => ({ ...c, shipId: s.id })));

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t("placeShips")}</h2>
        <p className="text-slate-500 text-sm mt-1">
          {t("positionFleetDesc")}
        </p>
      </div>

      {/* Mobile toolbar — visible below md */}
      <div className="flex lg:hidden items-center justify-between w-full bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900 leading-none">{placedShips.length}</span>
          <span className="text-sm text-slate-400 font-medium">/ 13 {t("ships")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOrientation(prev => prev === "horizontal" ? "vertical" : "horizontal")} className="flex gap-1.5">
            <RotateCw className={cn("transition-transform duration-300", orientation === "vertical" ? "rotate-90" : "")} size={14} />
            {orientation === "horizontal" ? t("h_short") : t("v_short")}
          </Button>
          <Button variant="white" size="sm" onClick={randomize} className="flex gap-1.5">
            <Shuffle size={14} /> {t("randomize")}
          </Button>
          <Button variant="outline" size="sm" onClick={reset} className="text-slate-600">{t("reset")}</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 items-start justify-center w-full">
        {/* Grid — centered on mobile */}
        <div className="w-full flex justify-center lg:block">
          <Grid
            cells={cells}
            onCellClick={handleCellClick}
            showShips
            active={!!currentShip}
          />
        </div>

        {/* Desktop side panel — hidden on mobile */}
        <div className="hidden lg:flex flex-col gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-72 shrink-0">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t("ships")}</span>
              <span className="text-xl font-bold text-slate-900">{placedShips.length} <span className="text-sm text-slate-400 font-medium">/ 13</span></span>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOrientation(prev => prev === "horizontal" ? "vertical" : "horizontal")}
            >
              <RotateCw className={cn("transition-transform duration-300", orientation === "vertical" ? "rotate-90" : "")} size={18} />
            </Button>
          </div>

          <div className="space-y-2">
            {SHIPS_CONFIG.map(s => {
              const count = placedShips.filter(ps => ps.size === s.size).length;
              const isDone = count >= s.count;
              return (
                <div key={s.name} className={cn(
                  "flex items-center justify-between p-2 rounded-md transition-colors",
                  isDone ? "bg-slate-50 text-slate-400" : "bg-white border border-slate-200"
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{t(s.name)}</span>
                    <div className="flex gap-1">
                      {Array.from({length: s.size}).map((_, i) => (
                        <div key={i} className={cn("w-2 h-2 rounded-sm", isDone ? "bg-slate-300" : "bg-blue-400")} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-semibold">{count}/{s.count}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="white" size="sm" onClick={randomize} className="flex gap-2">
                <Shuffle size={14} /> {t("randomize")}
              </Button>
              <Button variant="outline" size="sm" onClick={reset} className="flex gap-2 text-slate-600">
                {t("reset")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Start button — shown when all ships placed */}
      {placedShips.length === 13 && (
        <Button
          variant="blue"
          className="w-full max-w-sm mt-2 h-14 flex gap-2 text-base font-black uppercase tracking-widest"
          onClick={() => onComplete(placedShips)}
        >
          <Play size={18} fill="currentColor" /> {t("start")}
        </Button>
      )}
    </div>
  );
};
