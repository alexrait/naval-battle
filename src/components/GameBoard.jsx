import React, { useState, useEffect, useRef } from "react";
import { Grid } from "./Grid";
import { useLanguage } from "../context/LanguageContext";
import { SOUNDS } from "../lib/constants";
import { cn } from "../lib/utils";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

// Total ship cells in the game (all ships combined = 26)
const TOTAL_SHIP_CELLS = 26;

export const GameBoard = ({ initialShips, gameId, user }) => {
  const { t, lang } = useLanguage();
  const [playerShips] = useState(initialShips || []);
  const [opponentCells, setOpponentCells] = useState([]);
  const [playerCells, setPlayerCells] = useState([]);
  const [turn, setTurn] = useState("player");
  const [winner, setWinner] = useState(null);

  // Keep a stable ref to playerShips and playerCells for use inside Pusher callbacks
  const playerShipsRef = useRef(playerShips);
  const playerCellsRef = useRef([]);
  useEffect(() => { playerCellsRef.current = playerCells; }, [playerCells]);

  const playSound = (type) => {
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(() => {});
  };

  // Defender: work out if this hit sinks a ship
  const getSunkShip = (ships, hitCells) => {
    return ships.find(ship =>
      ship.cells.every(c =>
        hitCells.some(h => h.x === c.x && h.y === c.y && (h.status === "hit" || h.status === "sunk"))
      )
    ) || null;
  };

  const handleIncomingFire = async (x, y) => {
    const isHit = playerShipsRef.current.some(s => s.cells.some(c => c.x === x && c.y === y));
    const currentHits = [...playerCellsRef.current, { x, y, status: isHit ? "hit" : "miss" }];

    // Detect if this hit sinks a ship
    let sunkCells = null;
    let finalStatus = isHit ? "hit" : "miss";

    if (isHit) {
      const sunkShip = getSunkShip(playerShipsRef.current, currentHits);
      if (sunkShip) {
        sunkCells = sunkShip.cells;
        // Mark all sunk ship cells as "sunk" locally
        setPlayerCells(prev => {
          const withHit = prev.some(c => c.x === x && c.y === y)
            ? prev
            : [...prev, { x, y, status: "hit" }];
          return withHit.map(c =>
            sunkShip.cells.some(sc => sc.x === c.x && sc.y === c.y)
              ? { ...c, status: "sunk" }
              : c
          );
        });
      } else {
        setPlayerCells(prev => [...prev, { x, y, status: "hit" }]);
      }
    } else {
      setPlayerCells(prev => [...prev, { x, y, status: "miss" }]);
    }

    playSound(isHit ? "HIT" : "MISS");

    // keepTurn: attacker keeps their turn if they hit
    const keepTurn = isHit;

    await fetch("/.netlify/functions/report-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, x, y, status: finalStatus, senderId: user?.id, keepTurn, sunkCells })
    });

    // Defender: switch turn only if it was a miss
    if (!keepTurn) {
      setTurn("player");
    }
    // If hit, opponent keeps their turn — defender stays in "waiting" state
  };

  const handleFireResult = (x, y, status, keepTurn, sunkCells) => {
    setOpponentCells(prev => {
      let newCells = [...prev, { x, y, status }];

      // Mark sunk cells on opponent board
      if (sunkCells) {
        newCells = newCells.map(c =>
          sunkCells.some(sc => sc.x === c.x && sc.y === c.y)
            ? { ...c, status: "sunk" }
            : c
        );
        // Also add any sunk cells not yet tracked (cells that weren't separately fired at in this shot)
        sunkCells.forEach(sc => {
          if (!newCells.some(c => c.x === sc.x && c.y === sc.y)) {
            newCells.push({ x: sc.x, y: sc.y, status: "sunk" });
          }
        });
      }

      const totalHits = newCells.filter(c => c.status === "hit" || c.status === "sunk").length;
      if (totalHits >= TOTAL_SHIP_CELLS) setWinner("player");
      return newCells;
    });

    playSound(status === "hit" ? "HIT" : "MISS");

    // If it was a hit, keep my turn; if miss, switch to opponent
    setTurn(keepTurn ? "player" : "opponent");
  };

  useEffect(() => {
    if (!gameId) return;
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("fire", (data) => {
      if (data.senderId !== user?.id) {
        handleIncomingFire(data.x, data.y);
      }
    });

    channel.bind("fire-result", (data) => {
      if (data.senderId !== user?.id) {
        handleFireResult(data.x, data.y, data.status, data.keepTurn, data.sunkCells);
      }
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
      pusher.disconnect();
    };
  }, [gameId]);

  const handleFire = async (x, y) => {
    if (turn !== "player" || winner) return;
    // Don't fire on already-marked cells
    if (opponentCells.some(c => c.x === x && c.y === y)) return;
    setTurn("opponent");
    await fetch("/.netlify/functions/fire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, x, y, senderId: user?.id })
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
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-800/60 text-slate-300">
            {t("yourFleet")}
          </span>
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
