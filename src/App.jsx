import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { GameBoard } from "./components/GameBoard";
import { Button } from "./components/ui/Button";
import { ShipPlacement } from "./components/ShipPlacement";
import { useAuth } from "./hooks/useAuth";
import { useRealtime } from "./hooks/useRealtime";

const GameContent = () => {
  const { t, lang, toggleLanguage } = useLanguage();
  const { user, login, logout } = useAuth();
  const [gameState, setGameState] = useState("idle"); // idle, placement, playing
  const [playerShips, setPlayerShips] = useState([]);
  const [invite, setInvite] = useState(null);
  const [targetEmail, setTargetEmail] = useState("");
  const [currentGameId, setCurrentGameId] = useState(null);

  useEffect(() => {
    if (user) {
      // Sync user to DB so they are searchable by email
      fetch("/.netlify/functions/sync-user", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token?.access_token}` },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name
        })
      });
    }
  }, [user]);

  useRealtime(user?.id, (data) => {
    if (data.type === "incoming-invite") {
      setInvite(data);
    } else if (data.type === "invite-response") {
      if (data.accepted) {
        setCurrentGameId(data.gameId);
        setGameState("placement");
      } else {
        alert(`${data.responderName} declined your invite.`);
      }
    }
  });

  const sendInvite = async () => {
    if (!targetEmail) return;
    const res = await fetch("/.netlify/functions/send-invite", {
      method: "POST",
      body: JSON.stringify({ targetEmail })
    });
    if (res.ok) alert("Invite sent!");
    else alert("User not found or error");
  };

  const respondInvite = async (accepted) => {
    await fetch("/.netlify/functions/respond-invite", {
      method: "POST",
      body: JSON.stringify({ gameId: invite.gameId, senderId: invite.senderId, accepted })
    });
    if (accepted) {
      setCurrentGameId(invite.gameId);
      setGameState("placement");
    }
    setInvite(null);
  };

  return (
    <div className="ocean-bg p-6 flex flex-col items-center min-h-screen text-white overflow-hidden">
      <header className="w-full max-w-7xl flex justify-between items-center mb-16 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-tight marker-font text-blue-400 drop-shadow-md">
            {t("title")}
          </h1>
          <p className="text-sm tracking-[0.3em] text-blue-200/40 uppercase font-bold pl-1">{t("subtitle")}</p>
        </div>
        
        <div className="flex gap-6 items-center">
          <Button variant="ghost" onClick={toggleLanguage} className="rounded-full px-6 border border-white/5 hover:bg-white/5">
            {lang === "en" ? "עברית" : "English"}
          </Button>
          
          {user ? (
            <div className="flex items-center gap-6 bg-black/40 pl-6 pr-2 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="text-sm font-bold text-blue-100 italic">{user.user_metadata?.full_name}</span>
              <Button size="sm" onClick={logout} variant="outline" className="rounded-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20">{t("logout")}</Button>
            </div>
          ) : (
            <Button size="lg" onClick={login} className="rounded-full bg-blue-600 px-8 py-6 text-lg font-black tracking-wide marker-font">{t("login")}</Button>
          )}
        </div>
      </header>

      {/* Invite Notification */}
      {invite && (
        <div className="fixed top-28 right-8 bg-blue-600 p-8 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20 animate-in slide-in-from-right-full duration-500 z-50 max-w-sm">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-2 rounded-full">
                <Bell className="text-blue-900" size={24} />
              </div>
              <p className="text-xl font-black marker-font leading-tight">
                {invite.senderName} <span className="text-blue-200 block text-sm mt-1">{lang === "he" ? "מזמין אותך לקרב!" : "invites you to battle!"}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 rounded-2xl py-6 font-black bg-white text-blue-600 hover:bg-blue-50" onClick={() => respondInvite(true)}>{lang === "he" ? "קבל" : "Accept"}</Button>
            <Button variant="secondary" className="flex-1 rounded-2xl py-6 font-black bg-blue-700/50 border-white/10 hover:bg-blue-700" onClick={() => respondInvite(false)}>{lang === "he" ? "דחה" : "Decline"}</Button>
          </div>
        </div>
      )}

      <main className="w-full max-w-7xl flex flex-col items-center justify-center flex-1">
        {gameState === "idle" && user && (
          <div className="flex flex-col items-center gap-8 bg-slate-900/40 p-16 rounded-[4rem] backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.4)] animate-in zoom-in-90 duration-1000">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-5xl font-black text-white marker-font drop-shadow-lg leading-tight">{t("inviteFriend")}</h2>
              <p className="text-blue-200/40 text-sm tracking-widest uppercase font-bold italic">Challenge another captain to naval warfare</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <div className="relative flex-1">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <input 
                  type="email" 
                  placeholder="captain@fleet.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-lg text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10 transition-all"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={sendInvite} 
                className="rounded-2xl px-10 py-5 text-lg font-black marker-font bg-blue-600 hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
              >
                {t("send")}
              </Button>
            </div>
          </div>
        )}

        {!user && gameState === "idle" && (
          <div className="flex flex-col items-center gap-12 text-center max-w-2xl px-4 animate-in fade-in duration-1000">
             <div className="space-y-4">
               <h2 className="text-7xl font-black text-white marker-font drop-shadow-2xl">{t("title")}</h2>
               <p className="text-blue-200/50 text-xl font-bold Architects Daughter tracking-wide italic">"The sea is only the embodiment of a supernatural and wonderful existence."</p>
             </div>
             <Button onClick={login} className="rounded-full px-16 py-10 text-3xl font-black marker-font bg-gradient-to-br from-blue-500 to-indigo-700 hover:scale-110 transition-transform shadow-[0_20px_50px_rgba(37,99,235,0.4)]">
               {t("login")}
             </Button>
          </div>
        )}

        {gameState === "placement" && (
          <ShipPlacement onComplete={(ships) => { setPlayerShips(ships); setGameState("playing"); }} />
        )}
        
        {gameState === "playing" && (
          <GameBoard initialShips={playerShips} gameId={currentGameId} />
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
