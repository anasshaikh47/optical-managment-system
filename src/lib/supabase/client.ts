import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://lnwqzandufvjywgqbivj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud3F6YW5kdWZ2anl3Z3FiaXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MDY3MTIsImV4cCI6MjEwOTI4MjcxMn0.1S0yanvEFdgveFxL2QPvlhEf4cWGgbwX5zYbF9lk2U8";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseAnonKey =
    (rawKey && !rawKey.includes("placeholder") ? rawKey : "") ||
    DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
