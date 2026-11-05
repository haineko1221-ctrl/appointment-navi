import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 開発環境用：LocalStorageを使用している場合、middlewareでの認証チェックをスキップ
  // クライアント側で認証チェックを行う
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 未認証ユーザーを認証ページへリダイレクト
    if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // 認証済みユーザーが認証ページにアクセスした場合はダッシュボードへリダイレクト
    if (user && request.nextUrl.pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
