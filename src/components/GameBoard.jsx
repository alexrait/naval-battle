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

        <div className="hidden xl:block w-px h-96 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

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
    </div>
  );
};
