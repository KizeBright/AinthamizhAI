const express = require("express");

const { supabase } = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const defaultAnalytics = {
  totalTranslations: 0,
  ocrScans: 0,
  pronunciationAttempts: 0,
  sentenceGenerations: 0,
  entityAnalyses: 0,
};

const sanitizeString = (value, maxLength) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
};

const buildProfilePayload = (req) => {
  const displayName =
    sanitizeString(req.body.displayName, 120) || req.user.name || null;
  const photoURL = sanitizeString(req.body.photoURL, 2048) || req.user.picture;
  const preferredLevel = sanitizeString(req.body.preferredLevel, 40);
  const nativeLanguage = sanitizeString(req.body.nativeLanguage, 80);

  return {
    id: req.user.uid,
    email: req.user.email,
    email_verified: req.user.emailVerified,
    display_name: displayName,
    photo_url: photoURL,
    preferred_level: preferredLevel,
    native_language: nativeLanguage,
    updated_at: new Date().toISOString(),
  };
};

router.post("/register", async (req, res, next) => {
  try {
    const body = req.body || {};
    const email =
      sanitizeString(body.email, 320) ||
      sanitizeString(body.user?.email, 320) ||
      sanitizeString(body.credentials?.email, 320);
    const password =
      sanitizeString(body.password, 128) ||
      sanitizeString(body.user?.password, 128) ||
      sanitizeString(body.credentials?.password, 128);
    const displayName =
      sanitizeString(body.displayName, 120) ||
      sanitizeString(body.user_metadata?.displayName, 120) ||
      sanitizeString(body.user?.displayName, 120) ||
      sanitizeString(body.user?.user_metadata?.displayName, 120);

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email and password are required for registration.",
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        displayName,
      },
    });

    if (error) {
      console.error("Supabase registration error:", error.message);

      // Handle auth provider disabled
      if (error.message && error.message.includes("disabled")) {
        return res.status(503).json({
          error: "Auth Provider Unavailable",
          message: "Email authentication is currently disabled. Please check Supabase settings.",
          details: error.message,
        });
      }

      // Handle duplicate email
      if (error.message && error.message.includes("duplicate")) {
        return res.status(400).json({
          error: "Registration Failed",
          message: "Email already registered. Please login instead.",
        });
      }

      // Handle weak password
      if (error.message && error.message.includes("password")) {
        return res.status(400).json({
          error: "Registration Failed",
          message: "Password does not meet requirements (min 6 chars recommended).",
        });
      }

      return res.status(error.status || 400).json({
        error: "Registration Failed",
        message: error.message || "Unable to register user.",
      });
    }

    const user = data.user || null;
    let session = data.session;

    if (!session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        return res.status(loginError.status || 400).json({
          error: "Registration Login Failed",
          message: loginError.message || "Unable to sign in after registration.",
          details: loginError,
        });
      }

      session = loginData.session;
    }

    if (user && user.id) {
      await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          display_name: displayName || user.user_metadata?.displayName || null,
          analytics: defaultAnalytics,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["id"] },
      );
    }

    return res.status(201).json({
      message: "Registration successful.",
      user: user || null,
      session,
      access_token: session?.access_token || null,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email and password are required.",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase auth error:", error.message);

      // Handle specific Supabase auth configuration issues
      if (error.message && error.message.includes("disabled")) {
        return res.status(503).json({
          error: "Auth Provider Unavailable",
          message: "Email authentication is currently disabled. Please check Supabase settings.",
          details: error.message,
        });
      }

      // Handle invalid credentials
      if (error.message && (error.message.includes("Invalid") || error.message.includes("incorrect"))) {
        return res.status(401).json({
          error: "Login Failed",
          message: "Invalid email or password.",
        });
      }

      // Handle user not found
      if (error.message && error.message.includes("not found")) {
        return res.status(401).json({
          error: "Login Failed",
          message: "User not found. Please register first.",
        });
      }

      // Generic error
      return res.status(error.status || 401).json({
        error: "Login Failed",
        message: error.message || "Unable to sign in.",
      });
    }

    if (!data.session) {
      return res.status(401).json({
        error: "Login Failed",
        message: "No session returned. Please try again.",
      });
    }

    // Ensure user record exists in users table
    if (data.user && data.user.id) {
      await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.user_metadata?.displayName || data.user.user_metadata?.full_name || null,
          photo_url: data.user.user_metadata?.picture || null,
          analytics: defaultAnalytics,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["id"] },
      );
    }

    return res.status(200).json({
      message: "Login successful",
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    });
  } catch (error) {
    console.error("Login endpoint error:", error);
    return next(error);
  }
});

router.post("/profile", authMiddleware, async (req, res, next) => {
  try {
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("id", req.user.uid)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    const profilePayload = buildProfilePayload(req);

    await supabase.from("users").upsert(
      {
        ...profilePayload,
        analytics: existingUser ? undefined : defaultAnalytics,
        created_at: existingUser ? undefined : new Date().toISOString(),
      },
      { onConflict: ["id"] },
    );

    const { data: savedProfile, error: savedError } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.uid)
      .single();

    if (savedError) {
      throw savedError;
    }

    return res.status(existingUser ? 200 : 201).json({
      message: existingUser ? "User profile updated." : "User profile created.",
      user: savedProfile,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.uid)
      .single();

    if (error) {
      return res.status(404).json({
        error: "Not Found",
        message: "User profile not found.",
      });
    }

    return res.json({
      user: data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/debug-users", authMiddleware, async (req, res) => {
  if (req.user.claims?.admin !== true) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin access is required.",
    });
  }

  const { data, error } = await supabase
    .from("users")
    .select("*");

  res.json({
    data,
    error
  });
});

router.get("/verify", authMiddleware, (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user,
  });
});

module.exports = router;
