# アポイントナビ - セットアップ手順

## 📋 実装状況

### ✅ 完了したこと（フェーズ1: Supabase基盤構築）

1. パッケージインストール完了
   - `@supabase/supabase-js`
   - `@supabase/ssr`
   - `tesseract.js`

2. Supabaseクライアントファイル作成完了
   - `lib/supabase/client.ts` - クライアントサイド
   - `lib/supabase/server.ts` - サーバーサイド
   - `lib/supabase/middleware.ts` - セッション管理

3. データベース設計完了
   - `supabase-migration.sql` - テーブル作成SQLスクリプト

4. データ層実装完了
   - `lib/database.ts` - Supabase CRUD操作

5. 認証UI完了
   - `app/auth/login/page.tsx` - ログインページ
   - `app/auth/signup/page.tsx` - サインアップページ
   - `app/auth/callback/route.ts` - 認証コールバック

6. ルート保護完了
   - `middleware.ts` - 未認証ユーザーのリダイレクト

7. UI更新完了
   - `components/Navigation.tsx` - ログアウト機能追加
   - `types/index.ts` - PersonImage型追加

---

## 🚀 次のステップ（ユーザーが実施）

### ステップ1: Supabaseプロジェクト作成

1. https://supabase.com にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力:
   - **Name**: appointment-navi
   - **Database Password**: 安全なパスワードを設定（メモしておく）
   - **Region**: Tokyo (ap-northeast-1) 推奨
4. 「Create new project」をクリック

### ステップ2: データベーステーブル作成

1. Supabase Dashboard > SQL Editor を開く
2. `supabase-migration.sql` の内容を全てコピー
3. SQL Editorに貼り付けて「Run」をクリック
4. 成功メッセージを確認

### ステップ3: 環境変数設定

1. Supabase Dashboard > Settings > API を開く
2. 以下の値をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1...`

3. プロジェクトルートに `.env.local` ファイルを作成:

```bash
cd appointment-navi
cp .env.local.example .env.local
```

4. `.env.local` を編集して実際の値を入力:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

### ステップ4: アプリケーション起動

```bash
cd appointment-navi
npm run dev
```

### ステップ5: 動作確認

1. http://localhost:3000 にアクセス
2. 自動的に `/auth/login` にリダイレクトされることを確認
3. 「サインアップ」をクリックしてアカウント作成
4. メールアドレスに届いた確認メールのリンクをクリック
5. ログインして動作確認

---

## ⚠️ 既知の問題

現在、以下のファイルはまだSupabaseに対応していません（localStorageを使用中）:

- `app/page.tsx` - ダッシュボード
- `app/people/page.tsx` - 人物一覧
- `app/people/new/page.tsx` - 人物新規登録
- `app/people/[id]/page.tsx` - 人物詳細
- `app/people/[id]/edit/page.tsx` - 人物編集

### 対応方法

これらのファイルで以下の変更が必要です:

```typescript
// Before
import { getAllPeople, savePerson, ... } from '@/lib/storage';

// After
import { getAllPeople, savePerson, ... } from '@/lib/database';
```

**重要**: `lib/database.ts` の関数は全て `'use server'` なので、Client Componentから呼び出す場合は適切な処理が必要です。

---

## 📱 フェーズ2以降の機能（未実装）

### フェーズ2: 画像機能

実装予定:
- 画像アップロード機能
- 画像ギャラリー表示
- Supabase Storageバケット設定

必要な追加ファイル:
- `lib/imageUpload.ts`
- `components/ImageUpload.tsx`
- `components/ImageGallery.tsx`

### フェーズ3: OCR機能

実装予定:
- Tesseract.js統合
- 画像から自動テキスト抽出
- メモ欄への自動追記

必要な追加ファイル:
- `lib/ocr.ts`

---

## 🔧 トラブルシューティング

### エラー: "Invalid API key"

- `.env.local` ファイルが正しい場所にあるか確認
- 環境変数の値が正しいか確認
- アプリケーションを再起動 (`npm run dev`)

### エラー: "relation 'people' does not exist"

- `supabase-migration.sql` を実行したか確認
- Supabase Dashboard > Database > Tables で `people`, `contacts`, `images` テーブルが存在するか確認

### ログイン後にリダイレクトループ

- middlewareの設定を確認
- ブラウザのキャッシュをクリア

---

## 📚 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [計画書](/Users/a/.claude/plans/tidy-foraging-feigenbaum.md)

---

## 🎯 次に実装すべきこと

1. 既存ページのSupabase対応（優先度: 高）
2. 画像アップロード機能（フェーズ2）
3. OCR機能（フェーズ3）

質問や問題があれば、お気軽にお聞きください！
