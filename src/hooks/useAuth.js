import { useState, useEffect } from "react";
import netlifyIdentity from "netlify-identity-widget";
import "netlify-identity-widget/build/netlify-identity-widget.css";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Patch localStorage to prevent widget crash on init if user_metadata is missing
    try {
      const storageKey = "netlify-identity-user";
      const storedUser = localStorage.getItem(storageKey);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && !parsed.user_metadata) {
          parsed.user_metadata = { full_name: parsed.email?.split('@')[0] || "Soldier" };
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Failed to patch localStorage", e);
    }

    // Check if already initialized to avoid potential issues
    if (!window.__NETLIFY_IDENTITY_INITIALIZED__) {
      netlifyIdentity.init();
      window.__NETLIFY_IDENTITY_INITIALIZED__ = true;
    }

    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
      // Defensive check for currentUser metadata
      if (currentUser && !currentUser.user_metadata) {
        currentUser.user_metadata = { full_name: currentUser.email?.split('@')[0] || "Soldier" };
      }
      setUser(currentUser);
    }

    netlifyIdentity.on("login", (loggedInUser) => { 
      // Ensure user_metadata exists to prevent internal widget issues during transitions
      if (loggedInUser && !loggedInUser.user_metadata) {
        loggedInUser.user_metadata = { full_name: loggedInUser.email?.split('@')[0] || "Soldier" };
      }
      setUser(loggedInUser); 
      netlifyIdentity.close(); 
    });

    netlifyIdentity.on("logout", () => { 
      setUser(null); 
    });

    netlifyIdentity.on("error", (err) => {
      console.error("Netlify Identity Error:", err);
    });
  }, []);

  const login = () => netlifyIdentity.open();
  const logout = () => netlifyIdentity.logout();

  return { user, login, logout };
};
