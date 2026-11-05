'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // 初回ロード時にセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || null);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 認証状態変更 (Navigation):', event, session?.user?.email);
      setUserEmail(session?.user?.email || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // 認証ページではナビゲーションを表示しない
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              📅 アポイントナビ
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-8">
            <Link
              href="/"
              className="inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 border-b-2 border-transparent"
            >
              <span className="hidden sm:inline">ダッシュボード</span>
              <span className="sm:hidden">🏠</span>
            </Link>
            <Link
              href="/people"
              className="inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 border-b-2 border-transparent"
            >
              <span className="hidden sm:inline">👥 人物一覧</span>
              <span className="sm:hidden">👥</span>
            </Link>
            {userEmail && (
              <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-400">{userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1 whitespace-nowrap"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
