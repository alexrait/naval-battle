import React, { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    title: "Iron & Tide",
    subtitle: "Naval Combat Simulator",
    fire: "Fire!",
    miss: "Miss",
    hit: "Hit!",
    sink: "Sunk!",
    win: "Victory!",
    loss: "Defeat",
    ships: "Ships",
    turn: "Your Turn",
    opponentTurn: "Opponent Turn",
    placeShips: "Position your fleet",
    randomize: "Randomize",
    reset: "Reset",
    start: "Start Battle",
    horizontal: "Horizontal",
    vertical: "Vertical",
    login: "Login with Google",
    logout: "Logout",
    yourFleet: "Your Fleet",
    opponentFleet: "Target Water",
    inviteFriend: "Invite a Friend",
    send: "Send Invite",
    inviteSent: "Invite sent successfully!",
    userNotFound: "User not found or error",
    requestsBattle: "requests a naval engagement!",
    accept: "ACCEPT",
    decline: "DECLINE",
    targetCoordinates: "TARGET COORDINATES (EMAIL)",
    secureUplink: "Secure Tactical Uplink Active",
    commandSector: "COMMAND SECTOR",
    commander: "Commander",
    sectorSecure: "Sector Secure",
    readyForEngagement: "Ready for Engagement",
    positionFleetDesc: "Position your fleet on the board.",
    yourTurnFire: "Your Turn — Fire!",
    waitingForOpponent: "Waiting for opponent...",
    copyright: "Iron & Tide Strategy Group • Classified Operational Unit",
    declined: "declined your invite.",
    unknownSoldier: "Unknown Soldier",
    unknownCommander: "Unknown Commander",
    h_short: "H",
    v_short: "V",
    Carrier: "Carrier",
    Battleship: "Battleship",
    Destroyer: "Destroyer",
    Submarine: "Submarine",
  },
  he: {
    title: "קרב ימי",
    subtitle: "סימולטור קרב ימי",
    fire: "אש!",
    miss: "החטאה",
    hit: "פגיעה!",
    sink: "טביעה!",
    win: "ניצחון!",
    loss: "הפסד",
    ships: "ספינות",
    turn: "תורך",
    opponentTurn: "תור היריב",
    placeShips: "מקם את הצי שלך",
    randomize: "אקראי",
    reset: "איפוס",
    start: "התחל קרב",
    horizontal: "אופקי",
    vertical: "אנכי",
    login: "התחבר עם גוגל",
    logout: "התנתק",
    yourFleet: "הצי שלך",
    opponentFleet: "מפת היריב",
    inviteFriend: "הזמן חבר לקרב",
    send: "שלח הזמנה",
    inviteSent: "ההזמנה נשלחה בהצלחה!",
    userNotFound: "משתמש לא נמצא או שגיאה",
    requestsBattle: "מזמין אותך לקרב ימי!",
    accept: "קבל",
    decline: "דחה",
    targetCoordinates: "קורדינאטות מטרה (אימייל)",
    secureUplink: "ערוץ טקטי מאובטח פעיל",
    commandSector: "מגזר פיקוד",
    commander: "מפקד",
    sectorSecure: "המגזר מאובטח",
    readyForEngagement: "מוכן לקרב",
    positionFleetDesc: "הצב את הצי שלך על הלוח.",
    yourTurnFire: "תורך — תירה!",
    waitingForOpponent: "ממתין ליריב...",
    copyright: "קבוצת אסטרטגיה ברזל וגאות • יחידה מבצעית מסווגת",
    declined: "סירב להזמנה שלך.",
    unknownSoldier: "חייל אלמוני",
    unknownCommander: "מפקד אלמוני",
    h_short: "אופקי",
    v_short: "אנכי",
    Carrier: "נושאת מטוסים",
    Battleship: "סיירת",
    Destroyer: "משחתת",
    Submarine: "צוללת",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gameLanguage") || "en";
    }
    return "en";
  });

  const t = (key) => translations[lang][key] || key;

  const toggleLanguage = () => {
    setLang((prev) => {
      const nextLang = prev === "en" ? "he" : "en";
      if (typeof window !== "undefined") {
        localStorage.setItem("gameLanguage", nextLang);
      }
      return nextLang;
    });
  };

  useEffect(() => {
    document.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
