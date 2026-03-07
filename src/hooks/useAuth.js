import { useState, useEffect } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const netlifyIdentity = window.netlifyIdentity;
    if (!netlifyIdentity) return;
    netlifyIdentity.init();
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) setUser(currentUser);
    netlifyIdentity.on("login", (user) => { setUser(user); netlifyIdentity.close(); });
    netlifyIdentity.on("logout", () => { setUser(null); });
  }, []);

  const login = () => window.netlifyIdentity?.open();
  const logout = () => window.netlifyIdentity?.logout();

  return { user, login, logout };
};
