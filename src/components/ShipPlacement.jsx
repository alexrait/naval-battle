import React, { useState } from "react";
import { Grid } from "./Grid.jsx";
import { Button } from "./ui/Button.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { SHIPS_CONFIG, GRID_SIZE } from "../lib/constants";
import { RotateCw, Shuffle, Play } from "lucide-react";

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
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-blue-300">{t("placeShips")}</h2>
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <Grid cells={cells} onCellClick={handleCellClick} showShips active={!!currentShip} />
        <div className="flex flex-col gap-4 bg-black/20 p-6 rounded-xl border border-blue-500/20 backdrop-blur-md w-64">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-blue-200/60 font-medium">{t("ships")}: {placedShips.length} / 13</span>
            <Button size="icon" variant="ghost" onClick={() => setOrientation(prev => prev === "horizontal" ? "vertical" : "horizontal")}>
              <RotateCw className={orientation === "vertical" ? "rotate-90" : ""} size={18} />
            </Button>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={randomize} className="flex gap-2"><Shuffle size={14} /> {t("randomize")}</Button>
            <Button variant="outline" size="sm" onClick={reset}>{t("reset")}</Button>
            {placedShips.length === 13 && (
              <Button className="mt-4 flex gap-2 animate-bounce" onClick={() => onComplete(placedShips)}><Play size={16} fill="currentColor" /> {t("start")}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
