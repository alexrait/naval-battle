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
  },
  he: {
    title: "ברזל וגאות",
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
    opponentFleet: "מימי היריב",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("en");

  const t = (key) => translations[lang][key] || key;

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "he" : "en"));
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
