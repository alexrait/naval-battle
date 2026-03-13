import React, { useState, useEffect, useRef } from "react";
import { Grid } from "./Grid";
import { useLanguage } from "../context/LanguageContext";
import { playFire, playMiss, playHit, playKill } from "../lib/soundUtils";
import { cn } from "../lib/utils";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;
const TOTAL_SHIP_CELLS = 26;

/** Returns the 8 adjacent cells (incl. diagonals) around all cells of a ship */
const getAdjacentCells = (shipCells) => {
  const adj = new Map();
  shipCells.forEach(({ x, y }) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
          const key = `${nx},${ny}`;
          if (!adj.has(key)) adj.set(key, { x: nx, y: ny });
        }
      }
    }
  });
  return [...adj.values()];
};

export const GameBoard = ({ initialShips, gameId, user }) => {
  const { t, lang } = useLanguage();
  const [playerShips] = useState(initialShips || []);
  const [opponentCells, setOpponentCells] = useState([]);
  const [playerCells, setPlayerCells] = useState([]);
  const [turn, setTurn] = useState("player");
  const [winner, setWinner] = useState(null);

  const playerShipsRef = useRef(playerShips);
  const playerCellsRef = useRef([]);
  useEffect(() => { playerCellsRef.current = playerCells; }, [playerCells]);

  const handleIncomingFire = async (x, y) => {
    const hitShip = playerShipsRef.current.find(s => s.cells.some(c => c.x === x && c.y === y));
    const hit = !!hitShip;
    const newHit = { x, y, status: hit ? "hit" : "miss" };
    const currentHits = [...playerCellsRef.current, newHit];

    let sunkCells = null;
    const keepTurn = hit;

    if (hitShip) {
      // Check if this specific ship is now fully hit
      const isSunk = hitShip.cells.every(c =>
        currentHits.some(h => h.x === c.x && h.y === c.y && h.status !== "miss")
      );

      if (isSunk) {
        sunkCells = hitShip.cells;
        // Upgrade all sunk ship cells to "sunk" on my board
        setPlayerCells(prev => {
          const withNew = prev.some(c => c.x === x && c.y === y) ? prev : [...prev, newHit];
          return withNew.map(c =>
            hitShip.cells.some(sc => sc.x === c.x && sc.y === c.y) ? { ...c, status: "sunk" } : c
          );
        });
        playKill();
      } else {
        setPlayerCells(prev => [...prev, newHit]);
        playHit();
      }
    } else {
      setPlayerCells(prev => [...prev, newHit]);
      playMiss();
    }

    await fetch("/.netlify/functions/report-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, x, y, status: hit ? "hit" : "miss", senderId: user?.id, keepTurn, sunkCells })
    });

    if (!keepTurn) setTurn("player");
    // if hit, opponent keeps their turn, we wait
  };

  const handleFireResult = (x, y, status, keepTurn, sunkCells) => {
    setOpponentCells(prev => {
      // Start with the current hit cell
      let updated = [...prev];
      if (!updated.some(c => c.x === x && c.y === y)) {
        updated.push({ x, y, status });
      }

      if (sunkCells) {
        // Mark all sunk ship cells as "sunk"
        const sunkSet = new Set(sunkCells.map(c => `${c.x},${c.y}`));
        updated = updated.map(c => sunkSet.has(`${c.x},${c.y}`) ? { ...c, status: "sunk" } : c);
        // Add any sunk cells not yet tracked
        sunkCells.forEach(sc => {
          if (!updated.some(c => c.x === sc.x && c.y === sc.y)) {
            updated.push({ x: sc.x, y: sc.y, status: "sunk" });
          }
        });

        // Mark adjacent cells as "blocked" (can't fire there)
        const blocked = getAdjacentCells(sunkCells);
        blocked.forEach(b => {
          if (!updated.some(c => c.x === b.x && c.y === b.y)) {
            updated.push({ x: b.x, y: b.y, status: "blocked" });
          }
        });
      }

      const totalHits = updated.filter(c => c.status === "hit" || c.status === "sunk").length;
      if (totalHits >= TOTAL_SHIP_CELLS) setWinner("player");
      return updated;
    });

    if (sunkCells) playKill();
    else if (status === "hit") playHit();
    else playMiss();

    setTurn(keepTurn ? "player" : "opponent");
  };

  useEffect(() => {
    if (!gameId) return;
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("fire", (data) => {
      if (data.senderId !== user?.id) handleIncomingFire(data.x, data.y);
    });

    channel.bind("fire-result", (data) => {
      if (data.senderId !== user?.id) {
        handleFireResult(data.x, data.y, data.status, data.keepTurn, data.sunkCells);
      }
    });

    return () => { pusher.unsubscribe(`game-${gameId}`); pusher.disconnect(); };
  }, [gameId]);

  const handleFire = async (x, y) => {
    if (turn !== "player" || winner) return;
    if (opponentCells.some(c => c.x === x && c.y === y)) return;
    setTurn("opponent");
    playFire();
    await fetch("/.netlify/functions/fire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, x, y, senderId: user?.id })
    });
  };

  const isMyTurn = turn === "player";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 pb-8">

      {/* Turn indicator */}
      <div className={cn(
        "w-full max-w-sm rounded-2xl px-6 py-3 flex items-center justify-center gap-3 transition-all duration-500 shadow-lg",
        isMyTurn ? "bg-blue-600 shadow-blue-500/30" : "bg-slate-700 shadow-slate-900/30"
      )}>
        <div className={cn("w-2.5 h-2.5 rounded-full", isMyTurn ? "bg-white animate-pulse" : "bg-slate-400")} />
        <span className="text-sm font-black uppercase tracking-widest text-white">
          {isMyTurn
            ? t("yourTurnFire")
            : t("waitingForOpponent")}
        </span>
      </div>

      {winner && (
        <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-8 py-4 rounded-2xl shadow-lg animate-bounce">
          <h1 className="text-3xl font-black tracking-tight text-center">
            {winner === "player" ? t("win") : t("loss")}
          </h1>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 md:gap-12 items-center justify-center w-full">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-800/60 text-slate-300">
            {t("yourFleet")}
          </span>
          <Grid
            cells={playerShips.flatMap(s => s.cells.map(c => ({...c, shipId: s.id}))).concat(playerCells)}
            showShips
            active={false}
          />
        </div>

        <div className="xl:hidden w-full h-px bg-slate-200/20" />
        <div className="hidden xl:block w-px h-64 bg-slate-200/20" />

        <div className="flex flex-col items-center gap-3">
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300",
            isMyTurn && !winner
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 animate-pulse"
              : "bg-slate-800/60 text-slate-400"
          )}>
            {t("opponentFleet")} {isMyTurn && !winner ? "⚡" : ""}
          </span>
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
