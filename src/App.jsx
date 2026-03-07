import React, { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { GameBoard } from "./components/GameBoard";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { ShipPlacement } from "./components/ShipPlacement";
import { useAuth } from "./hooks/useAuth";
import { useRealtime } from "./hooks/useRealtime";
import { Mail, Bell, Play, Anchor, Shield, Target } from "lucide-react";
import { cn } from "./lib/utils";

const GameContent = () => {
  const { t, lang, toggleLanguage } = useLanguage();
  const { user, login, logout } = useAuth();
  const [gameState, setGameState] = useState("idle"); 
  const [playerShips, setPlayerShips] = useState([]);
  const [invite, setInvite] = useState(null);
  const [targetEmail, setTargetEmail] = useState("");
  const [currentGameId, setCurrentGameId] = useState(null);

  useEffect(() => {
    if (user) {
      fetch("/.netlify/functions/sync-user", {
        method: "POST",
        body: JSON.stringify({ id: user.id, email: user.email, name: user.user_metadata?.full_name })
      });
    }
  }, [user]);

  useRealtime(user?.id, (data) => {
    if (data.type === "incoming-invite") setInvite(data);
    else if (data.type === "invite-response") {
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
    <div className="ocean-bg relative min-h-screen w-full flex flex-col font-sans">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-0" />
      
      {user && (
        <header className="relative z-20 w-full px-8 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Anchor className="text-white" size={22} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-lg font-bold tracking-tight text-white leading-none">IRON & TIDE</span>
                <span className="text-[10px] text-blue-400/60 uppercase tracking-[0.2em] font-bold">{t("subtitle")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Button variant="ghost" onClick={toggleLanguage} className="text-xs h-9">
                {lang === "en" ? "עברית" : "English"}
              </Button>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-300">{user.user_metadata?.full_name}</span>
                <Button size="sm" variant="outline" onClick={logout} className="h-8 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 uppercase font-bold">
                  {t("logout")}
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {invite && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-full duration-500">
          <div className="bg-slate-900/90 border border-blue-500/30 backdrop-blur-2xl p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-80 text-left">
            <div className="flex gap-4 mb-4">
              <div className="h-12 w-12 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/20">
                <Bell className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">{invite.senderName}</p>
                <p className="text-xs text-slate-400 mt-1">{lang === "he" ? "מזמין אותך לקרב!" : "invites you to battle!"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 h-10 text-xs" onClick={() => respondInvite(true)}>{lang === "he" ? "קבל" : "Accept"}</Button>
              <Button variant="outline" className="flex-1 h-10 text-xs" onClick={() => respondInvite(false)}>{lang === "he" ? "דחה" : "Decline"}</Button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center p-6">
        {!user && gameState === "idle" && (
          <div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center">
            <div className="hidden lg:flex flex-col gap-6 text-left">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase w-fit">
                  <Shield size={14} /> Tactical Simulator v1.0
               </div>
               <h1 className="text-8xl font-black text-white leading-[0.9] tracking-tighter marker-font">
                 Command <br /> <span className="text-blue-500">The Tides.</span>
               </h1>
               <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-medium architect-font">
                 Experience high-stakes naval warfare with our advanced tactical grid system. 
                 Challenge rivals globally in real-time combat.
               </p>
               <div className="flex gap-8 mt-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white marker-font">10x10</span>
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Grid Size</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white marker-font">13</span>
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Ships per fleet</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white marker-font">LIVE</span>
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Online PvP</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full max-w-md bg-slate-900/40 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                
                <div className="text-center space-y-4 mb-10">
                  <h2 className="text-4xl font-black text-white marker-font tracking-tight">{t("title")}</h2>
                  <p className="text-slate-400 text-sm font-medium">{lang === "en" ? "Authorize fleet command to proceed" : "אשר פיקוד על הצי כדי להמשיך"}</p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={login} 
                    size="lg" 
                    className="w-full rounded-2xl py-8 text-lg font-black bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02] transition-all flex gap-4 shadow-2xl"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>
                  
                  <div className="relative py-4 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">Standard Protocol</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={toggleLanguage} 
                    className="w-full rounded-2xl py-6 text-sm font-bold border-white/5 hover:bg-white/5"
                  >
                    {lang === "en" ? "עבור לעברית" : "Switch to English"}
                  </Button>
                </div>

                <p className="mt-10 text-center text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">
                  Encrypted Connection Secured
                </p>
              </div>
              
              <div className="mt-8 flex gap-8">
                 <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest">
                    <Shield size={12} /> Netlify Identity
                 </div>
                 <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest">
                    <Anchor size={12} /> Neon Postgres
                 </div>
              </div>
            </div>
          </div>
        )}

        {gameState === "idle" && user && (
          <div className="flex flex-col items-center gap-10 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-6xl font-black text-white marker-font drop-shadow-lg leading-tight">{t("inviteFriend")}</h2>
              <p className="text-blue-200/40 text-lg tracking-widest uppercase font-bold italic architect-font text-center">"Challenge another captain to naval warfare"</p>
            </div>
            
            <div className="w-full bg-slate-900/40 border border-white/10 backdrop-blur-3xl rounded-[3rem] p-12 md:p-16 flex flex-col items-center gap-10 shadow-2xl">
              <div className="h-20 w-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center border border-blue-500/20 shadow-inner">
                <Target className="text-blue-500" size={40} />
              </div>
              
              <div className="flex flex-col gap-4 w-full max-w-md">
                <div className="relative group text-left">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-colors" size={24} />
                  <Input 
                    type="email" 
                    placeholder="captain@enemy-fleet.com"
                    className="pl-16 h-16 rounded-2xl bg-white/5 border-white/5"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendInvite} 
                  className="w-full h-16 rounded-2xl text-xl font-black marker-font tracking-wide"
                >
                  {t("send")}
                </Button>
              </div>

              <div className="flex items-center gap-6 w-full max-w-sm opacity-20">
                <div className="h-px flex-1 bg-white" />
                <Anchor size={16} className="text-white" />
                <div className="h-px flex-1 bg-white" />
              </div>
            </div>
          </div>
        )}

        {gameState === "placement" && (
          <ShipPlacement onComplete={(ships) => { setPlayerShips(ships); setGameState("playing"); }} />
        )}
        
        {gameState === "playing" && (
          <GameBoard initialShips={playerShips} gameId={currentGameId} />
        )}
      </main>

      <footer className="relative z-10 w-full p-8 text-center border-t border-white/5 bg-slate-950/20">
        <p className="text-[10px] text-white/10 font-black uppercase tracking-[1em] architect-font">
          Iron & Tide &copy; 2026 Strategic Naval Simulation
        </p>
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
