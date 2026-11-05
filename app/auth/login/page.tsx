'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';

export default function LoginPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: any) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);

    try {
      // refから直接値を取得（Safari対応）
      const emailValue = emailRef.current?.value.trim() || '';
      const passwordValue = passwordRef.current?.value || '';

      if (!emailValue || !passwordValue) {
        setError('メールアドレスとパスワードを入力してください');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // ログイン成功、リダイレクト
      window.location.href = '/';
    } catch (err: any) {
      setError('予期しないエラーが発生しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            アポイントナビ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">ログインしてください</p>
        </div>

        <Card>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                ref={emailRef}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                パスワード
              </label>
              <input
                ref={passwordRef}
                type="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">アカウントをお持ちでない方は</span>
              {' '}
              <Link href="/auth/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                サインアップ
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
