import { createBrowserClient } from '@supabase/ssr';

/**
 * Singleton do Supabase Client (browser-side).
 * 
 * Evita criar múltiplas instâncias a cada render de componente,
 * prevenindo memory leaks e listeners duplicados.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
