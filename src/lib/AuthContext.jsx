import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

const PROFILE_RETRY_DELAY = 1500;
const PROFILE_MAX_RETRIES = 3;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem("app_role");
  };

  const fetchProfile = async (userId, retries = 0) => {
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
      console.log("Profile fetch failed:", err);
      if (retries < PROFILE_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, PROFILE_RETRY_DELAY));
        return fetchProfile(userId, retries + 1);
      }
      setProfile(null);
      return null;
    }
  };

  const handleSession = async (session) => {
    if (!session?.user) {
      clearState();
      setAuthError({ type: "auth_required" });
      return;
    }

    setUser(session.user);

    const profileData = await fetchProfile(session.user.id);

    if (!profileData) {
      setIsAuthenticated(true);
      setAuthError({ type: "profile_incomplete" });
      return;
    }

    setIsAuthenticated(true);
    setAuthError(null);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) setIsLoadingAuth(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        await handleSession(data.session);
      } catch (err) {
        console.log("Auth init failed:", err);
        clearState();
        setAuthError({ type: "auth_required", message: err?.message || "Auth init failed" });
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    };

    init();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) setIsLoadingAuth(true);

      try {
        await handleSession(session);
      } catch (err) {
        console.log("Auth state change failed:", err);
        clearState();
        setAuthError({ type: "auth_required", message: err?.message || "Auth state change failed" });
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log("Logout failed:", err);
    } finally {
      clearState();
      setAuthError({ type: "auth_required" });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
