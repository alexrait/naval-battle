import React, { useState, useEffect } from "react";
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
    <div className="ocean-bg flex flex-col items-center min-h-screen text-white overflow-x-hidden">
      {/* Dynamic Header - Hidden on Landing */}
      {user && (
        <header className="w-full max-w-7xl flex justify-between items-center mt-6 mx-auto bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Play fill="white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black marker-font text-blue-400 leading-none">{t("title")}</h1>
              <p className="text-[10px] tracking-[0.2em] text-blue-200/40 uppercase font-bold">{t("subtitle")}</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <Button variant="ghost" onClick={toggleLanguage} className="text-xs rounded-full px-4 border border-white/5 hover:bg-white/5">
              {lang === "en" ? "עברית" : "English"}
            </Button>
            
            <div className="flex items-center gap-4 bg-black/20 pl-4 pr-1 py-1 rounded-full border border-white/5">
              <span className="text-xs font-bold text-blue-100">{user.user_metadata?.full_name}</span>
              <Button size="sm" onClick={logout} variant="ghost" className="h-7 text-[10px] rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 uppercase tracking-tighter font-bold">{t("logout")}</Button>
            </div>
          </div>
        </header>
      )}

      {/* Invite Notification */}
      {invite && (
        <div className="fixed top-24 right-8 bg-blue-600 p-6 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20 animate-in slide-in-from-right-full duration-500 z-50 max-w-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-400 p-2 rounded-full shadow-inner">
              <Bell className="text-blue-900" size={20} />
            </div>
            <p className="text-lg font-black marker-font">
              {invite.senderName} <span className="text-blue-200 block text-xs mt-0.5">{lang === "he" ? "מזמין אותך לקרב!" : "invites you to battle!"}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 rounded-xl py-4 font-bold bg-white text-blue-600 hover:bg-blue-50 text-sm" onClick={() => respondInvite(true)}>{lang === "he" ? "קבל" : "Accept"}</Button>
            <Button variant="secondary" className="flex-1 rounded-xl py-4 font-bold bg-blue-700/50 border-white/10 hover:bg-blue-700 text-sm" onClick={() => respondInvite(false)}>{lang === "he" ? "דחה" : "Decline"}</Button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full flex flex-col items-center justify-center p-6 relative z-10">
        
        {/* LANDING SCREEN */}
        {!user && gameState === "idle" && (
          <div className="flex flex-col items-center gap-12 text-center animate-in fade-in zoom-in-95 duration-1000">
             <div className="relative group">
                <div className="absolute -inset-8 bg-blue-600/20 blur-3xl rounded-full animate-pulse" />
                <h2 className="text-8xl md:text-9xl font-black text-white marker-font drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] glow-text relative">
                  {t("title")}
                </h2>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400/50" />
                  <p className="text-blue-200/60 text-xl font-bold Architects Daughter tracking-widest uppercase">{t("subtitle")}</p>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400/50" />
                </div>
             </div>

             <div className="iron-panel p-10 md:p-16 rounded-[3rem] w-full max-w-md flex flex-col gap-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black marker-font text-white">{t("login")}</h3>
                  <p className="text-slate-400 text-sm">{lang === "en" ? "Sign in to command your fleet" : "התחבר כדי לפקד על הצי שלך"}</p>
                </div>
                <Button 
                  onClick={login} 
                  size="lg" 
                  className="w-full rounded-2xl py-8 text-xl font-black marker-font bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex gap-3"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 bg-white rounded-sm p-0.5" alt="" />
                  {lang === "en" ? "Continue with Google" : "המשך עם גוגל"}
                </Button>
                <div className="pt-4">
                   <button onClick={toggleLanguage} className="text-blue-400/60 hover:text-blue-400 text-sm font-bold underline underline-offset-4 decoration-blue-400/20">
                    {lang === "en" ? "עבור לעברית" : "Switch to English"}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* LOBBY / INVITE SCREEN */}
        {gameState === "idle" && user && (
          <div className="flex flex-col items-center gap-10 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-6xl font-black text-white marker-font drop-shadow-lg leading-tight">{t("inviteFriend")}</h2>
              <p className="text-blue-200/40 text-lg tracking-widest uppercase font-bold italic Architects Daughter">"Every captain needs a worthy rival"</p>
            </div>
            
            <div className="glass-card p-12 md:p-16 rounded-[4rem] flex flex-col items-center gap-8 w-full shadow-[0_50px_100px_rgba(0,0,0,0.4)]">
              <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center border border-blue-400/30">
                <Mail className="text-blue-400" size={40} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                <div className="relative flex-1 group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={24} />
                  <input 
                    type="email" 
                    placeholder="captain@enemy-fleet.com"
                    className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-8 py-6 text-xl text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10 transition-all shadow-inner"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendInvite} 
                  className="rounded-3xl px-12 py-6 text-xl font-black marker-font bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/30"
                >
                  {t("send")}
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-white/20 w-full max-w-md">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ready for Combat</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        )}

        {/* SHIP PLACEMENT */}
        {gameState === "placement" && (
          <ShipPlacement onComplete={(ships) => { setPlayerShips(ships); setGameState("playing"); }} />
        )}
        
        {/* GAME BOARD */}
        {gameState === "playing" && (
          <GameBoard initialShips={playerShips} gameId={currentGameId} />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="w-full p-8 text-center text-white/10 text-[10px] font-black uppercase tracking-[0.5em] Architects Daughter z-0">
        Iron & Tide &copy; 2026 Strategic Naval Simulation
      </footer>
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
