import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem("app_role");
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err) {
      console.log("No profile found:", err);
      setProfile(null);
      return null;
    }
  };

  const handleSession = async (session) => {
    if (!session?.user) {
      clearState();
      return;
    }

    setUser(session.user);

    const profileData = await fetchProfile(session.user.id);

    // 🔥 أهم نقطة: لا نسمح بوجود session بدون profile
    if (!profileData) {
      await supabase.auth.signOut();
      clearState();
      return;
    }

    setIsAuthenticated(true);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoadingAuth(true);

      const { data } = await supabase.auth.getSession();
      await handleSession(data.session);

      setIsLoadingAuth(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoadingAuth(true);
        await handleSession(session);
        setIsLoadingAuth(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    clearState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoadingAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
