import React, { useState, useEffect } from "react";
import { Grid } from "./Grid";
import { useLanguage } from "../context/LanguageContext";
import { SOUNDS } from "../lib/constants";
import { cn } from "../lib/utils";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

const getCurrentUserId = () => window.netlifyIdentity?.currentUser?.()?.id;

export const GameBoard = ({ initialShips, gameId }) => {
  const { t, lang } = useLanguage();
  const [playerShips] = useState(initialShips || []);
  const [opponentCells, setOpponentCells] = useState([]);
  const [playerCells, setPlayerCells] = useState([]);
  const [turn, setTurn] = useState("player");
  const [winner, setWinner] = useState(null);

  const playSound = (type) => {
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(() => {});
  };

  const handleIncomingFire = async (x, y) => {
    const isHit = playerShips.some(s => s.cells.some(c => c.x === x && c.y === y));
    const status = isHit ? "hit" : "miss";
    setPlayerCells(prev => [...prev, { x, y, status }]);
    playSound(isHit ? "HIT" : "MISS");
    await fetch("/.netlify/functions/report-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, x, y, status, senderId: getCurrentUserId() })
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

  useEffect(() => {
    if (!gameId) return;
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("fire", (data) => {
      if (data.senderId !== getCurrentUserId()) {
        handleIncomingFire(data.x, data.y);
      }
    });

    channel.bind("fire-result", (data) => {
      if (data.senderId !== getCurrentUserId()) {
        handleFireResult(data.x, data.y, data.status);
      }
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
      pusher.disconnect();
    };
  }, [gameId, playerShips]);

  const handleFire = async (x, y) => {
    if (turn !== "player" || winner) return;
    setTurn("opponent");
    await fetch("/.netlify/functions/fire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, x, y, senderId: getCurrentUserId() })
    });
  };

  const isMyTurn = turn === "player";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 pb-8">

      {/* Turn indicator banner */}
      <div className={cn(
        "w-full max-w-sm rounded-2xl px-6 py-3 flex items-center justify-center gap-3 transition-all duration-500 shadow-lg",
        isMyTurn
          ? "bg-blue-600 shadow-blue-500/30"
          : "bg-slate-700 shadow-slate-900/30"
      )}>
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          isMyTurn ? "bg-white animate-pulse" : "bg-slate-400"
        )} />
        <span className="text-sm font-black uppercase tracking-widest text-white">
          {isMyTurn
            ? (lang === "he" ? "תורך — ירה!" : "Your Turn — Fire!")
            : (lang === "he" ? "ממתין ליריב..." : "Waiting for opponent...")}
        </span>
      </div>

      {/* Win/loss banner */}
      {winner && (
        <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-8 py-4 rounded-2xl shadow-lg animate-bounce">
          <h1 className="text-3xl font-black tracking-tight text-center">
            {winner === "player" ? t("win") : t("loss")}
          </h1>
        </div>
      )}

      {/* Boards */}
      <div className="flex flex-col xl:flex-row gap-6 md:gap-12 items-center justify-center w-full">
        {/* Player Board */}
        <div className="flex flex-col items-center gap-3">
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full",
            "bg-slate-800/60 text-slate-300"
          )}>{t("yourFleet")}</span>
          <Grid
            cells={playerShips.flatMap(s => s.cells.map(c => ({...c, shipId: s.id}))).concat(playerCells)}
            showShips
            active={false}
          />
        </div>

        {/* Divider */}
        <div className="xl:hidden w-full h-px bg-slate-200/20" />
        <div className="hidden xl:block w-px h-64 bg-slate-200/20" />

        {/* Opponent Board */}
        <div className="flex flex-col items-center gap-3">
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300",
            isMyTurn && !winner
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 animate-pulse"
              : "bg-slate-800/60 text-slate-400"
          )}>{t("opponentFleet")} {isMyTurn && !winner ? "⚡" : ""}</span>
          <Grid
            cells={opponentCells}
            onCellClick={handleFire}
            active={isMyTurn && !winner}
          />
        </div>
      </div>
    </div>
  );
};
