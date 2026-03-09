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
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user?.id && user?.email) {
      const syncUser = async () => {
        try {
          const response = await fetch("/.netlify/functions/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              id: user.id, 
              email: user.email, 
              name: user.user_metadata?.full_name || "Unknown Soldier"
            })
          });
          if (!response.ok) {
            console.warn(`User sync responded with status: ${response.status}`);
          }
        } catch (err) {
          console.error("Sync user fetch failed", err);
        }
      };
      syncUser();
    }
  }, [user]);

  useRealtime(user?.id, (data) => {
    if (data.type === "incoming-invite") setInvite(data);
    else if (data.type === "invite-response") {
      if (data.accepted) {
        setCurrentGameId(data.gameId);
        setGameState("placement");
      } else {
        showToast(`${data.responderName} declined your invite.`, "error");
      }
    }
  });

  const sendInvite = async () => {
    if (!targetEmail) return;
    const res = await fetch("/.netlify/functions/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEmail,
        senderId: user.id,
        senderName: user.user_metadata?.full_name || "Unknown Commander",
      })
    });
    if (res.ok) {
      showToast(lang === "he" ? "ההזמנה נשלחה בהצלחה!" : "Invite sent successfully!");
      setTargetEmail("");
    } else {
      showToast(lang === "he" ? "משתמש לא נמצא" : "User not found or error", "error");
    }
  };

  const respondInvite = async (accepted) => {
    await fetch("/.netlify/functions/respond-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: invite.gameId,
        senderId: invite.senderId,
        accepted,
        responderName: user.user_metadata?.full_name || "Unknown Commander",
      })
    });
    if (accepted) {
      setCurrentGameId(invite.gameId);
      setGameState("placement");
    }
    setInvite(null);
  };

  return (
    <div className="ocean-bg relative min-h-screen w-full flex flex-col font-sans text-slate-100 selection:bg-yellow-500/30">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl text-sm font-black uppercase tracking-widest animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === "error"
            ? "bg-red-600 text-white"
            : "bg-emerald-500 text-white"
        }`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.message}
        </div>
      )}

      {/* Professional Header */}
      {user && (
        <header className="relative z-20 w-full px-4 md:px-8 py-3 md:py-5 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-9 h-9 md:w-12 md:h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10 border border-yellow-400/50 transition-transform hover:rotate-3 shrink-0">
                <Anchor className="text-slate-950" size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-lg md:text-2xl font-black tracking-tighter title-font uppercase text-white leading-none">IRON &amp; TIDE</span>
                <span className="hidden md:block text-[10px] text-yellow-500 uppercase tracking-[0.5em] font-black mt-1 opacity-80">{t("subtitle")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-8">
              <Button variant="ghost" onClick={toggleLanguage} className="text-xs h-8 md:h-9 px-2 md:px-3 font-bold tracking-widest uppercase text-slate-300 hover:text-white">
                {lang === "en" ? "עב'" : "EN"}
                <span className="hidden md:inline">{lang === "en" ? "רית" : "GLISH"}</span>
              </Button>
              <div className="hidden md:block h-6 w-px bg-slate-700/50" />
              <div className="flex items-center gap-2 md:gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-0.5">Commander</span>
                  <span className="text-sm font-black tactical-font text-white">{user?.user_metadata?.full_name || "Unknown"}</span>
                </div>
                <Button size="sm" variant="outline" onClick={logout} className="h-8 md:h-9 px-3 md:px-4 text-[10px] border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900/50 transition-all uppercase font-black tracking-widest">
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
          <div className="bg-white border border-blue-100 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.1)] w-96 text-left">
            <div className="flex gap-6 mb-8">
              <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <Bell className="text-blue-600" size={32} />
              </div>
              <div>
                <p className="text-xl font-black tactical-font uppercase text-blue-900 leading-tight">{invite.senderName}</p>
                <p className="text-sm text-slate-500 mt-2">{lang === "he" ? "מזמין אותך לקרב ימי!" : "requests a naval engagement!"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 h-14 text-sm font-black uppercase tracking-widest bg-blue-600" onClick={() => respondInvite(true)}>{lang === "he" ? "קבל" : "ACCEPT"}</Button>
              <Button variant="outline" className="flex-1 h-14 text-sm font-black uppercase tracking-widest border-blue-100 text-blue-600 hover:bg-blue-50" onClick={() => respondInvite(false)}>{lang === "he" ? "דחה" : "DECLINE"}</Button>
            </div>
          </div>
        </div>
      )}

      <main className={`relative flex-1 w-full flex flex-col items-center px-4 md:px-6 ${
        gameState === "idle"
          ? "justify-center py-8 min-h-[calc(100vh-4rem)]"
          : "justify-start py-6 pb-16"
      }`}>
        
        {/* CENTERED PREMIUM LOGIN SCREEN */}
        {!user && gameState === "idle" && (
          <div className="flex flex-col items-center justify-center w-full max-w-2xl mb-12 animate-in fade-in zoom-in-95 duration-1000">
            <div 
              className="iron-panel rounded-[4rem] w-full flex flex-col items-center gap-12 text-center relative overflow-hidden group border border-slate-700/30"
              style={{ padding: '3rem 4rem 5rem 4rem' }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-gold-400/10 blur-[100px] rounded-full" />
              
              <div className="relative">
                <h1 className="text-8xl font-black text-white tracking-tighter title-font uppercase mb-6 leading-none select-none" style={{ fontSize: '5rem' }}>Iron & Tide</h1>
                <div className="flex items-center justify-center gap-6 text-gold-500/40 font-black uppercase tracking-[0.6em] text-[12px]">
                  <div className="h-px w-12 bg-gold-500/20" />
                  <span>COMMAND SECTOR</span>
                  <div className="h-px w-12 bg-gold-500/20" />
                </div>
              </div>

              <div className="w-full space-y-16 relative z-10">
                <button 
                  onClick={login} 
                  style={{ 
                    backgroundColor: '#eab308', 
                    color: '#020617', 
                    height: '60px', 
                    width: 'auto',
                    minWidth: '280px',
                    padding: '0 2.5rem',
                    borderRadius: '1rem',
                    fontSize: '1rem',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    boxShadow: '0 20px 40px -10px rgba(234, 179, 10, 0.3)',
                    border: 'none',
                    borderBottom: '3px solid #ca8a04',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '4rem auto',
                    transition: 'transform 0.2s'
                  }}
                  className="hover:bg-gold-400 active:scale-[0.97]"
                >
                  Login with Google
                </button>
                <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-60">
                    <Shield size={14} className="text-gold-500/50" />
                    <span>Secure Tactical Uplink Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === "idle" && user && (
          <div className="flex flex-col items-center gap-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white tracking-tighter title-font uppercase">{t("inviteFriend")}</h2>
              <div className="h-1 w-24 bg-yellow-500 mx-auto rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
            
            <div className="w-full glass-card rounded-[2.5rem] p-12 flex flex-col items-center gap-10">
              <div className="flex flex-col gap-6 w-full max-w-md">
                <div className="relative group text-left">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Target size={20} className="text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                  </div>
                  <Input 
                    type="email" 
                    placeholder="TARGET COORDINATES (EMAIL)"
                    className="h-16 pl-14 rounded-2xl bg-slate-900/50 border-slate-700/50 focus:border-yellow-500/50 focus:bg-slate-900 focus:ring-yellow-500/20 text-lg font-bold tactical-font placeholder:text-slate-600 transition-all uppercase"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendInvite} 
                  className="w-full h-16 rounded-2xl text-lg relative overflow-hidden group shadow-2xl"
                >
                  <span className="relative z-10">{t("send")}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-bold text-[10px] tracking-[0.3em] uppercase">
                <Shield size={14} />
                <span>Sector Secure</span>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <span>Ready for Engagement</span>
              </div>
            </div>
          </div>
        )}

        {gameState === "placement" && (
          <ShipPlacement onComplete={(ships) => { setPlayerShips(ships); setGameState("playing"); }} />
        )}
        
        {gameState === "playing" && (
        <GameBoard initialShips={playerShips} gameId={currentGameId} user={user} />
        )}
      </main>

      <footer className="relative z-10 w-full py-4 px-4 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.5em] border-t border-slate-800/30">
        &copy; {new Date().getFullYear()} Iron &amp; Tide Strategy Group • Classified Operational Unit
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
