import React, { useState, useEffect, useCallback } from "react";
import { Grid } from "./Grid";
import { useLanguage } from "../context/LanguageContext";
import { SOUNDS } from "../lib/constants";
import { cn } from "../lib/utils";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

export const GameBoard = ({ initialShips, gameId }) => {
  const { t } = useLanguage();
  const [playerShips] = useState(initialShips || []);
  const [opponentCells, setOpponentCells] = useState([]);
  const [playerCells, setPlayerCells] = useState([]);
  const [turn, setTurn] = useState("player"); // We can refine this based on who invited whom
  const [winner, setWinner] = useState(null);

  const playSound = (type) => {
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(e => console.log("Sound error:", e));
  };

  useEffect(() => {
    if (!gameId) return;

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("fire", (data) => {
      if (data.senderId !== window.netlifyIdentity.currentUser()?.id) {
        handleIncomingFire(data.x, data.y);
      }
    });

    channel.bind("fire-result", (data) => {
      if (data.senderId !== window.netlifyIdentity.currentUser()?.id) {
        handleFireResult(data.x, data.y, data.status);
      }
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
      pusher.disconnect();
    };
  }, [gameId, playerShips]);

  const handleIncomingFire = async (x, y) => {
    const isHit = playerShips.some(s => s.cells.some(c => c.x === x && c.y === y));
    const status = isHit ? "hit" : "miss";
    
    setPlayerCells(prev => [...prev, { x, y, status }]);
    playSound(isHit ? "HIT" : "MISS");

    await fetch("/.netlify/functions/report-result", {
      method: "POST",
      body: JSON.stringify({ gameId, x, y, status })
    });
    
    setTurn("player");
  };

  const handleFireResult = (x, y, status) => {
    setOpponentCells(prev => {
      const newCells = [...prev, { x, y, status }];
      if (newCells.filter(c => c.status === "hit").length === 26) setWinner("player");
      return newCells;
    });
    playSound(status === "hit" ? "HIT" : "MISS");
  };

  const handleFire = async (x, y) => {
    if (turn !== "player" || winner) return;

    setTurn("opponent");
    await fetch("/.netlify/functions/fire", {
      method: "POST",
      body: JSON.stringify({ gameId, x, y })
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex flex-col items-center gap-2">
        <h2 className={cn(
          "text-2xl font-bold tracking-tight transition-colors duration-300",
          turn === "player" ? "text-blue-600" : "text-red-500"
        )}>
          {turn === "player" ? t("turn") : t("opponentTurn")}
        </h2>
        {winner && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-sm mt-4 animate-bounce">
            <h1 className="text-3xl font-black">
              {winner === "player" ? t("win") : t("loss")}
            </h1>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-12 items-center justify-center w-full">
        {/* Player Board */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t("yourFleet")}</span>
          <Grid 
            cells={playerShips.flatMap(s => s.cells.map(c => ({...c, shipId: s.id}))).concat(playerCells)} 
            showShips 
            active={false} 
          />
        </div>

        {/* Vertical Divider for XL screens */}
        <div className="hidden xl:block w-px h-64 bg-slate-200" />

        {/* Opponent Board */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t("opponentFleet")}</span>
          <Grid 
            cells={opponentCells} 
            onCellClick={handleFire} 
            active={turn === "player" && !winner} 
          />
        </div>
      </div>
    </div>
  );
};

