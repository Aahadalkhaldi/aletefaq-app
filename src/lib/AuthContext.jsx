import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

const PROFILE_RETRY_DELAY = 1500;
const PROFILE_MAX_RETRIES = 3;
const AUTH_GLOBAL_TIMEOUT_MS = 12000;

const buildMockProfile = (user) => ({
  id: user.id,
  email: user.email || "",
  full_name: user.user_metadata?.full_name || user.email || "\u0645\u0633\u062a\u062e\u062f\u0645",
  role: user.user_metadata?.role || "client",
  status: "active",
  phone: user.phone || "",
  created_at: new Date().toISOString(),
  _isMock: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const globalTimeoutRef = useRef(null);

  const forceStopLoading = () => {
    setIsLoadingAuth(false);
  };

  useEffect(() => {
    if (isLoadingAuth) {
      globalTimeoutRef.current = setTimeout(() => {
        console.warn("Auth global timeout \u2014 forcing isLoadingAuth=false");
        forceStopLoading();
        if (!authError) {
          setAuthError({ type: "auth_required", message: "Auth timeout" });
        }
      }, AUTH_GLOBAL_TIMEOUT_MS);
    } else {
      if (globalTimeoutRef.current) {
        clearTimeout(globalTimeoutRef.current);
        globalTimeoutRef.current = null;
      }
    }
    return () => {
      if (globalTimeoutRef.current) {
        clearTimeout(globalTimeoutRef.current);
      }
    };
  }, [isLoadingAuth]);

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
      return null;
    }
  };

  const createDefaultProfile = async (user) => {
    try {
      const newProfile = {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email || "",
        role: user.user_metadata?.role || "client",
        status: "pending",
        phone: user.phone || "",
      };
      const { data, error } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.log("Auto profile creation failed:", err);
      return null;
    }
  };

  const handleSession = async (session) => {
    if (!session?.user) {
      clearState();
      setAuthError({ type: "auth_required" });
      setIsLoadingAuth(false);
      return;
    }

    setUser(session.user);

    try {
      let profileData = await fetchProfile(session.user.id);

      if (!profileData) {
        profileData = await createDefaultProfile(session.user);
      }

      if (!profileData) {
        profileData = await fetchProfile(session.user.id, PROFILE_MAX_RETRIES - 1);
      }

      if (!profileData) {
        const mock = buildMockProfile(session.user);
        setProfile(mock);
        console.warn("Using mock profile \u2014 no DB profile found or created");
      }

      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
    } catch (err) {
      console.error("handleSession error:", err);
      const mock = buildMockProfile(session.user);
      setProfile(mock);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
    }
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
      setIsLoadingAuth(false);
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
