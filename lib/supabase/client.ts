import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// シングルトンインスタンス
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  // すでにインスタンスが存在する場合はそれを返す
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // 新しいインスタンスを作成
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // 開発環境用：LocalStorageを使用（IPアドレスでも動作する）
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return supabaseInstance;
}
