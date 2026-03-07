import React, { useState, useEffect, useCallback } from "react";
import { Grid } from "./Grid";
import { useLanguage } from "../context/LanguageContext";
import { SOUNDS } from "../lib/constants";

export const GameBoard = ({ initialShips }) => {
  const { t } = useLanguage();
  const [playerShips] = useState(initialShips || []);
  const [opponentCells, setOpponentCells] = useState([]);
  const [playerCells, setPlayerCells] = useState([]);
  const [turn, setTurn] = useState("player");
  const [winner, setWinner] = useState(null);

  const playSound = (type) => {
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(e => console.log("Sound error:", e));
  };

  const handleFire = useCallback((x, y) => {
    if (turn !== "player" || winner) return;

    const isHit = Math.random() > 0.8; 
    const status = isHit ? "hit" : "miss";

    setOpponentCells(prev => {
      const newCells = [...prev, { x, y, status }];
      const totalHits = newCells.filter(c => c.status === "hit").length;
      if (totalHits === 26) setWinner("player");
      return newCells;
    });

    if (isHit) playSound("HIT");
    else playSound("MISS");

    setTurn("opponent");
    
    setTimeout(() => {
      const aiX = Math.floor(Math.random() * 10);
      const aiY = Math.floor(Math.random() * 10);
      const aiHit = playerShips.some(s => s.cells.some(c => c.x === aiX && c.y === aiY));
      
      setPlayerCells(prev => {
        const newCells = [...prev, { x: aiX, y: aiY, status: aiHit ? "hit" : "miss" }];
        const totalAiHits = newCells.filter(c => c.status === "hit").length;
        if (totalAiHits === 26) setWinner("opponent");
        return newCells;
      });

      if (aiHit) playSound("HIT");
      else playSound("MISS");
      setTurn("player");
    }, 1000);
  }, [turn, winner, playerShips]);

  return (
    <div className="flex flex-col items-center gap-12 w-full">
      <div className="flex flex-col items-center gap-2">
        <h2 className={turn === "player" ? "text-2xl font-bold text-blue-400" : "text-2xl font-bold text-slate-500"}>
          {turn === "player" ? t("turn") : t("opponentTurn")}
        </h2>
        {winner && <h1 className="text-4xl font-black text-yellow-400 animate-bounce">{winner === "player" ? t("win") : t("loss")}</h1>}
      </div>
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-medium text-blue-300/60 uppercase tracking-widest">{t("yourFleet")}</span>
          <Grid cells={playerShips.flatMap(s => s.cells.map(c => ({...c, shipId: s.id}))).concat(playerCells)} showShips active={false} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-medium text-red-400/60 uppercase tracking-widest">{t("opponentFleet")}</span>
          <Grid cells={opponentCells} onCellClick={handleFire} active={turn === "player" && !winner} />
        </div>
      </div>
    </div>
  );
};
