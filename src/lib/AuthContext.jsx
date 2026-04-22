import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

const AUTH_TIMEOUT = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const timeoutRef = useRef(null);

  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsLoadingAuth(false);
  };

  const handleSession = async (session) => {
    if (!session?.user) {
      clearState();
      return;
    }

    setUser(session.user);

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profileData) {
        try {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || "مستخدم جديد",
              role: "client",
              status: "active",
            })
            .select()
            .single();

          setProfile(newProfile || {
            id: session.user.id,
            email: session.user.email,
            role: "client",
            status: "active",
          });
        } catch {
          setProfile({
            id: session.user.id,
            email: session.user.email,
            role: "client",
            status: "active",
          });
        }
      } else {
        setProfile(profileData);
      }

      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      console.error("Auth session handling error:", err);
      setProfile({
        id: session.user.id,
        email: session.user.email,
        role: "client",
        status: "active",
      });
      setIsAuthenticated(true);
    } finally {
      setIsLoadingAuth(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (isLoadingAuth) {
        console.warn("Auth timeout reached");
        supabase.auth.getSession().then(({ data: { session } }) => {
          setIsLoadingAuth(false);
          setIsAuthenticated(!!session?.user);
          if (session?.user) {
            setUser(session.user);
            if (!profile) {
              setProfile({
                id: session.user.id,
                email: session.user.email,
                role: "client",
                status: "active",
              });
            }
          }
        }).catch(() => {
          setIsLoadingAuth(false);
        });
      }
    }, AUTH_TIMEOUT);

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    clearState();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoadingAuth,
        authError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
