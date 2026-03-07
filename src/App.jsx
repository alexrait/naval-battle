import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import { GameBoard } from "./components/GameBoard.jsx";
import { Button } from "./components/ui/Button.jsx";
import { ShipPlacement } from "./components/ShipPlacement.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useRealtime } from "./hooks/useRealtime.js";

const GameContent = () => {
  const { t, lang, toggleLanguage } = useLanguage();
  const { user, login, logout } = useAuth();
  const [gameState, setGameState] = useState("placement"); // placement, playing
  const [playerShips, setPlayerShips] = useState([]);

  const handlePlacementComplete = (ships) => {
    setPlayerShips(ships);
    setGameState("playing");
  };

  return (
    <div className="ocean-bg p-4 flex flex-col items-center min-h-screen text-white">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 bg-black/30 p-4 rounded-lg backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-blue-400">{t("title")}</h1>
          <p className="text-sm text-blue-200/60">{t("subtitle")}</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Button variant="ghost" onClick={toggleLanguage}>
            {lang === "en" ? "עברית" : "English"}
          </Button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">{user.user_metadata?.full_name}</span>
              <Button size="sm" onClick={logout}>{t("logout")}</Button>
            </div>
          ) : (
            <Button size="sm" onClick={login}>{t("login")}</Button>
          )}
        </div>
      </header>

      <main className="w-full max-w-6xl flex flex-col items-center gap-8">
        {gameState === "placement" && (
          <ShipPlacement onComplete={handlePlacementComplete} />
        )}
        
        {gameState === "playing" && (
          <GameBoard initialShips={playerShips} />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <GameContent />
    </LanguageProvider>
  );
}

export default App;
