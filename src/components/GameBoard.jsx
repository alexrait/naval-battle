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
    <div className="flex flex-col items-center gap-12 w-full max-w-7xl animate-in fade-in zoom-in-95 duration-700 pb-20">
      <div className="flex flex-col items-center gap-4 bg-black/40 px-12 py-6 rounded-full border border-blue-500/20 backdrop-blur-md shadow-2xl">
        <h2 className={cn(
          "text-3xl font-bold tracking-widest uppercase transition-all duration-500 marker-font",
          turn === "player" ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
        )}>
          {turn === "player" ? t("turn") : t("opponentTurn")}
        </h2>
        {winner && (
          <h1 className="text-5xl font-black text-yellow-400 marker-font animate-bounce drop-shadow-lg">
            {winner === "player" ? t("win") : t("loss")}
          </h1>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-20 items-center justify-center w-full">
        {/* Player Board */}
        <div className="flex flex-col items-center gap-6 group">
          <div className="bg-blue-600/80 px-6 py-2 rounded-t-lg border-x border-t border-white/20 transform translate-y-1">
            <span className="text-lg font-bold text-white uppercase tracking-[0.2em] marker-font">{t("yourFleet")}</span>
          </div>
          <Grid 
            cells={playerShips.flatMap(s => s.cells.map(c => ({...c, shipId: s.id}))).concat(playerCells)} 
            showShips 
            active={false} 
            rotation={-1.5}
            className="shadow-2xl"
          />
        </div>

        {/* Vertical Divider for XL screens */}
        <div className="hidden xl:block w-px h-96 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

        {/* Opponent Board */}
        <div className="flex flex-col items-center gap-6 group">
          <div className="bg-red-600/80 px-6 py-2 rounded-t-lg border-x border-t border-white/20 transform translate-y-1">
            <span className="text-lg font-bold text-white uppercase tracking-[0.2em] marker-font">{t("opponentFleet")}</span>
          </div>
          <Grid 
            cells={opponentCells} 
            onCellClick={handleFire} 
            active={turn === "player" && !winner} 
            rotation={1.2}
            className="shadow-2xl hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      </div>

      {/* Combat Log / Status could go here */}
    </div>
  );
};
