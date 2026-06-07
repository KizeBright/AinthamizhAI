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
      user_metadata: {
        displayName,
      },
    });

    if (error) {
      return res.status(error.status || 400).json({
        error: "Registration Failed",
        message: error.message || "Unable to register user.",
        details: error,
      });
    }

    const user = data.user || null;

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

    const responsePayload = {
      message: "Registration successful.",
      user: user || null,
    };

    if (data.session) {
      responsePayload.session = data.session;
    } else {
      responsePayload.notice =
        "Registration completed. A confirmation email may be required before sign-in.";
    }

    return res.status(201).json(responsePayload);
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
      return res.status(401).json({
        error: "Login Failed",
        message: error.message,
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    });
  } catch (error) {
    next(error);
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

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.uid)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: "Not Found",
        message: "No user profile exists for this authenticated user.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

router.get("/verify", authMiddleware, (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user,
  });
});

module.exports = router;
