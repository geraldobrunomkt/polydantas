import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local (veja .env.local.example)."
  );
}

// Client de servidor com a service role key: ignora RLS.
// Nunca importe este arquivo em código que roda no navegador.
export const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
