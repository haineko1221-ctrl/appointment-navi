'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // 認証ページはチェックをスキップ
      if (pathname?.startsWith('/auth')) {
        setIsLoading(false);
        setIsAuthenticated(true);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      console.log('🔐 認証チェック:', { pathname, session: !!session });

      if (!session) {
        console.log('❌ 未認証 → ログインページへ');
        router.push('/auth/login');
      } else {
        console.log('✅ 認証済み');
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    checkAuth();

    // セッション変更を監視
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 認証状態変更:', event, !!session);

      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        if (!pathname?.startsWith('/auth')) {
          router.push('/auth/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // ローディング中は何も表示しない
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    );
  }

  // 認証済みまたは認証ページの場合のみ子要素を表示
  return isAuthenticated ? <>{children}</> : null;
}
