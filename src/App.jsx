import React, { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { GameBoard } from "./components/GameBoard";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { ShipPlacement } from "./components/ShipPlacement";
import { useAuth } from "./hooks/useAuth";
import { useRealtime } from "./hooks/useRealtime";
import { Mail, Bell, Anchor, Shield, Target, Play } from "lucide-react";
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
    <div className="ocean-bg relative min-h-screen w-full flex flex-col font-sans overflow-x-hidden text-slate-100">
      {/* Dynamic Header */}
      {user && (
        <header className="relative z-20 w-full px-8 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Anchor className="text-white" size={24} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black tracking-tight tactical-font uppercase">IRON & TIDE</span>
                <span className="text-[10px] text-blue-400 uppercase tracking-[0.4em] font-black">{t("subtitle")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Button variant="ghost" onClick={toggleLanguage} className="text-xs h-9 font-bold tracking-widest uppercase">
                {lang === "en" ? "HEBREW" : "ENGLISH"}
              </Button>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-6">
                <span className="text-sm font-bold tactical-font">{user.user_metadata?.full_name}</span>
                <Button size="sm" variant="outline" onClick={logout} className="h-8 text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 uppercase font-black tracking-widest">
                  {t("logout")}
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Invite Notification */}
      {invite && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-full duration-500">
          <div className="bg-slate-900 border border-blue-500/30 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] w-96 text-left">
            <div className="flex gap-6 mb-8">
              <div className="h-16 w-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <Bell className="text-blue-400" size={32} />
              </div>
              <div>
                <p className="text-xl font-black tactical-font uppercase text-white leading-tight">{invite.senderName}</p>
                <p className="text-sm text-slate-400 mt-2">{lang === "he" ? "מזמין אותך לקרב ימי!" : "requests a naval engagement!"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 h-14 text-sm font-black uppercase tracking-widest" onClick={() => respondInvite(true)}>{lang === "he" ? "קבל" : "ACCEPT"}</Button>
              <Button variant="outline" className="flex-1 h-14 text-sm font-black uppercase tracking-widest border-white/10" onClick={() => respondInvite(false)}>{lang === "he" ? "דחה" : "DECLINE"}</Button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center p-6">
        {!user && gameState === "idle" && (
          <div className="w-full max-w-6xl flex flex-col items-center text-center fade-up gap-16">
            <div className="space-y-6">
               <div className="w-fit mx-auto px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase">
                  Global Naval Command • Tactical Simulator
               </div>
               <h1 className="text-9xl md:text-[12rem] font-black text-white leading-[0.8] tracking-tighter tactical-font italic">
                 IRON<span className="text-blue-600">&</span>TIDE
               </h1>
               <p className="text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium font-serif">
                 Strategic grid-based warfare for the modern commander.
               </p>
            </div>

            <div className="w-full max-w-md command-card rounded-[2.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-2xl font-black text-white tactical-font tracking-widest uppercase">{t("login")}</h2>
                <div className="h-0.5 w-16 bg-blue-600 mx-auto opacity-50" />
              </div>

              <div className="space-y-6">
                <Button 
                  onClick={login} 
                  className="w-full rounded-xl py-8 text-lg font-black bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02] transition-all flex gap-4 shadow-xl"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  ENGAGE WITH GOOGLE
                </Button>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] text-white/20 font-black tracking-widest uppercase">Encryption Active</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <Button 
                  variant="outline" 
                  onClick={toggleLanguage} 
                  className="w-full rounded-xl py-6 text-xs font-black tracking-[0.2em] border-white/5 hover:bg-white/5 uppercase"
                >
                  {lang === "en" ? "SWITCH TO HEBREW" : "עבור לאנגלית"}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-16 opacity-20 text-[10px] font-black uppercase tracking-[0.4em] tactical-font">
               <div className="flex items-center gap-3"><Shield size={14}/> Integrated Identity</div>
               <div className="flex items-center gap-3"><Anchor size={14}/> Neon DB Synced</div>
               <div className="flex items-center gap-3"><Target size={14}/> Pusher Real-Time</div>
            </div>
          </div>
        )}

        {gameState === "idle" && user && (
          <div className="flex flex-col items-center gap-16 w-full max-w-4xl fade-up">
            <div className="text-center space-y-6">
              <h2 className="text-7xl font-black text-white tactical-font tracking-tight uppercase">{t("inviteFriend")}</h2>
              <div className="flex items-center justify-center gap-6">
                 <div className="h-px w-16 bg-blue-500/30" />
                 <p className="text-blue-400 text-sm font-black uppercase tracking-[0.5em] italic">Scan for Rival Signal</p>
                 <div className="h-px w-16 bg-blue-500/30" />
              </div>
            </div>
            
            <div className="w-full command-card rounded-[4rem] p-16 md:p-24 flex flex-col items-center gap-16 border border-blue-500/20">
              <div className="h-32 w-32 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                <Target className="text-blue-500 animate-pulse" size={64} />
              </div>
              
              <div className="flex flex-col gap-8 w-full max-w-md text-left">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Signature (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={24} />
                    <Input 
                      type="email" 
                      placeholder="rival@command.net"
                      className="pl-16 h-20 rounded-2xl bg-white/5 border-white/5 focus:border-blue-500/40 text-xl tactical-font shadow-inner"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={sendInvite} 
                  className="w-full h-20 rounded-2xl text-2xl font-black tactical-font hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-blue-600/30 uppercase tracking-widest"
                >
                  {t("send")}
                </Button>
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

      <footer className="relative z-10 w-full p-12 text-center border-t border-white/5 bg-slate-950/40">
        <p className="text-[10px] text-white/10 font-black uppercase tracking-[1em] tactical-font">
          IRON & TIDE TACTICAL SIMULATION &bull; CLASSIFIED COMMAND
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
