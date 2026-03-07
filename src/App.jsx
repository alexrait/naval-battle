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
    <div className="ocean-bg relative min-h-screen w-full flex flex-col font-sans overflow-x-hidden text-slate-900">
      
      {/* Professional Header */}
      {user && (
        <header className="relative z-20 w-full px-8 py-4 border-b border-blue-100 bg-white/70 backdrop-blur-xl shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Anchor className="text-white" size={24} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black tracking-tight tactical-font uppercase text-blue-900">IRON & TIDE</span>
                <span className="text-[10px] text-blue-600 uppercase tracking-[0.4em] font-black">{t("subtitle")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Button variant="ghost" onClick={toggleLanguage} className="text-xs h-9 font-bold tracking-widest uppercase text-blue-800 hover:bg-blue-50">
                {lang === "en" ? "HEBREW" : "ENGLISH"}
              </Button>
              <div className="h-4 w-px bg-blue-100" />
              <div className="flex items-center gap-6">
                <span className="text-sm font-bold tactical-font text-blue-900">{user.user_metadata?.full_name}</span>
                <Button size="sm" variant="outline" onClick={logout} className="h-8 text-[10px] border-red-200 text-red-600 hover:bg-red-50 uppercase font-black tracking-widest">
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

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center p-6">
        
        {/* EXTREMELY SIMPLE LOGIN SCREEN */}
        {!user && gameState === "idle" && (
          <div className="flex flex-col items-center justify-center gap-6">
            <h1 className="text-4xl font-bold text-blue-900 tracking-tight">Iron & Tide</h1>
            <Button 
              onClick={login} 
              className="px-8 py-6 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg flex items-center gap-3"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        )}

        {gameState === "idle" && user && (
          <div className="flex flex-col items-center gap-10 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-blue-900 tracking-tight">{t("inviteFriend")}</h2>
            </div>
            
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center gap-8 shadow-sm">
              <div className="flex flex-col gap-4 w-full max-w-md">
                <div className="relative group text-left">
                  <Input 
                    type="email" 
                    placeholder="friend@email.com"
                    className="h-14 rounded-lg bg-slate-50 border-slate-200 focus:border-blue-400 focus:bg-white text-lg"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendInvite} 
                  className="w-full h-14 rounded-lg text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
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

      {user && (
        <footer className="relative z-10 w-full p-6 text-center text-slate-400 text-sm">
          Iron & Tide
        </footer>
      )}
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
