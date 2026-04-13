import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const clearLocalAuthState = () => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem("app_role");
    localStorage.removeItem("base44_access_token");
    localStorage.removeItem("token");
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .limit(1);

      if (error) throw error;

      const profileRow = data?.[0] || null;
      setProfile(profileRow);
      return profileRow;
    } catch (err) {
      console.error("Profile fetch failed:", err);
      setProfile(null);
      return null;
    }
  };

  const applySession = async (session) => {
    if (!session?.user) {
      clearLocalAuthState();
      return;
    }

    setUser(session.user);

    const profileData = await fetchProfile(session.user.id);

    if (profileData) {
      setIsAuthenticated(true);
      setAuthError(null);
      return;
    }

    clearLocalAuthState();
    setAuthError({
      type: "profile_missing",
      message: "User session exists, but no profile was found.",
    });

    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Forced sign out failed:", signOutError);
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      await applySession(session);
    } catch (err) {
      console.error("Auth check failed:", err);
      clearLocalAuthState();
      setAuthError({
        type: "auth_required",
        message: err?.message || "Authentication check failed.",
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoadingAuth(true);
      setAuthError(null);

      try {
        await applySession(session);
      } catch (err) {
        console.error("Auth state change failed:", err);
        clearLocalAuthState();
        setAuthError({
          type: "auth_state_change_failed",
          message: err?.message || "Authentication state update failed.",
        });
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearLocalAuthState();
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  const checkAppState = () => checkAuth();

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    return await fetchProfile(user.id);
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
        appPublicSettings: null,
        logout,
        navigateToLogin,
        checkAppState,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
