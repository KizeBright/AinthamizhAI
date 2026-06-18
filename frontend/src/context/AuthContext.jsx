/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import API, { setAuthTokenProvider } from "../services/api";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      setIdToken(null);
      return null;
    }

    const token = data.session.access_token;
    setIdToken(token);
    return token;
  }, []);

  useEffect(() => {
    setAuthTokenProvider(() => refreshToken());

    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user || null;

      if (user) {
        setCurrentUser(user);
        setIdToken(data.session.access_token);
        try {
          await API.post("/auth/profile", {
            displayName: user.user_metadata?.displayName || user.user_metadata?.full_name,
            photoURL: user.user_metadata?.picture,
          });
          await API.post("/analytics/session").catch(() => {});
        } catch (error) {
          setAuthError(
            error?.response?.data?.message ||
            error.message ||
            "Unable to sync your profile.",
          );
        }
      }

      setLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        try {
          const user = session?.user || null;
          setCurrentUser(user);
          setAuthError("");

          if (user) {
            const token = session.access_token;
            setIdToken(token);
            await API.post("/auth/profile", {
              displayName: user.user_metadata?.displayName || user.user_metadata?.full_name,
              photoURL: user.user_metadata?.picture,
            });
            await API.post("/analytics/session").catch(() => {});
          } else {
            setIdToken(null);
          }
        } catch (error) {
          setAuthError(
            error?.response?.data?.message ||
            error.message ||
            "Unable to sync your profile.",
          );
        } finally {
          setLoading(false);
        }
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe();
      setAuthTokenProvider(null);
    };
  }, [refreshToken]);

  const login = useCallback(async (email, password) => {
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    await refreshToken();
    return data.user;
  }, [refreshToken]);

  const register = useCallback(async ({ email, password, displayName }) => {
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
        },
      },
    });

    if (error) {
      throw error;
    }

    await refreshToken();
    await API.post("/auth/profile", { displayName });
    return data.user;
  }, [refreshToken]);

  const logout = useCallback(async () => {
    setAuthError("");
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIdToken(null);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setAuthError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?mode=recovery`,
    });

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = async (password) => {
    setAuthError("");
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }

    await refreshToken();
    return data.user;
  };

  const value = useMemo(
    () => ({
      authError,
      currentUser,
      forgotPassword,
      getIdToken: refreshToken,
      idToken,
      isAuthenticated: Boolean(currentUser),
      loading,
      login,
      logout,
      register,
      updatePassword,
    }),
    [
      authError,
      currentUser,
      forgotPassword,
      idToken,
      loading,
      login,
      logout,
      refreshToken,
      register,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
