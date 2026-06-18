const { supabase } = require("../config/supabase");

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "A valid Bearer token is required.",
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired Supabase access token.",
      });
    }

    const user = data.user;

    req.user = {
      uid: user.id,
      email: user.email || null,
      name:
        user.user_metadata?.displayName ||
        user.user_metadata?.full_name ||
        null,
      picture: user.user_metadata?.picture || null,
      emailVerified: Boolean(user.email_confirmed_at),
      claims: user,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired Supabase access token.",
    });
  }
};

module.exports = authMiddleware;
