import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

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
      console.log("Profile fetch failed:", err);
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
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.log("Sign out after missing profile failed:", signOutError);
      }

      clearState();
      setAuthError({ type: "user_not_registered" });
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
