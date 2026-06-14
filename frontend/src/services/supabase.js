import { createClient } from "@supabase/supabase-js";

const normalizeSupabaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/g, "");

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingKeys = [
  ["VITE_SUPABASE_URL", supabaseUrl],
  ["VITE_SUPABASE_ANON_KEY", supabaseAnonKey],
].filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(
    `Missing Supabase client config values: ${missingKeys.join(", ")}`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
