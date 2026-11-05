# 開発過程で遭遇した問題とエラー一覧

アポイントナビの開発過程で発生した主要な問題、エラー、解決策をまとめたドキュメント

## 目次
1. [認証関連の問題](#認証関連の問題)
2. [開発環境・ネットワーク関連](#開発環境ネットワーク関連)
3. [UI/UX関連](#uiux関連)
4. [データ管理関連](#データ管理関連)
5. [モジュール・ビルド関連](#モジュールビルド関連)

---

## 認証関連の問題

### 問題1: Safari + IPアドレスでCookieが保存されない
**症状**:
- PCではログインできるが、スマホ（Safari）ではログインできない
- IPアドレス経由でアクセスした場合、Cookieベースのセッションが機能しない

**原因**:
- SafariのセキュリティポリシーでIPアドレスドメインでのCookie保存が制限されている
- `@supabase/ssr`がCookieベースのセッション管理を使用していた

**解決策**:
- `@supabase/ssr` → `@supabase/supabase-js`に変更
- セッション管理をCookieからLocalStorageに変更
- シングルトンパターンでクライアントインスタンスを管理

**修正ファイル**: `lib/supabase/client.ts`

```typescript
// 修正前
import { createBrowserClient } from '@supabase/ssr'

// 修正後
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
  return supabaseInstance;
}
```

**エラーメッセージ**:
```
⚠ @supabase/ssr: auth.storage option is being ignored because createBrowserClient only uses localStorage.
```

---

### 問題2: ミドルウェアが認証をブロック
**症状**:
- ログイン後、画面が「読み込み中」から進まない
- AuthGuardコンポーネントで無限ループ

**原因**:
- `middleware.ts`がサーバーサイドでCookie認証チェックを実行
- LocalStorageはサーバーサイドでアクセスできない
- 開発環境でのLocalStorage使用とミドルウェアが競合

**解決策**:
1. 開発環境ではミドルウェアの認証チェックをスキップ
2. AuthGuardコンポーネントを削除
3. `middleware.ts`を`middleware.ts.disabled`にリネーム

**修正ファイル**: `lib/supabase/middleware.ts`

```typescript
// 開発環境用：LocalStorageを使用している場合、middlewareでの認証チェックをスキップ
const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment) {
  // 本番環境のみ認証チェックを実行
}
```

---

## 開発環境・ネットワーク関連

### 問題3: 🔴 最重要問題 - Cross-Origin HMRブロッキング
**症状**:
- スマホでログインボタンを押しても反応しない
- PCでは動作するが、IPアドレス経由のモバイルでJavaScriptが実行されない
- Reactのstateが更新されない

**原因**:
- Next.js 16のTurbopackが、セキュリティ上の理由でIPアドレスからのHMR（Hot Module Replacement）リクエストをブロック
- クロスオリジンのdev resourceアクセスが拒否される

**エラーメッセージ**:
```
⚠ Blocked cross-origin request to Next.js dev resource /_next/hmr from "192.168.0.6"
```

**解決策**:
`next.config.ts`に`allowedDevOrigins`を追加

**修正ファイル**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // IPアドレス経由でのアクセスを許可（開発環境）
  allowedDevOrigins: ['192.168.0.6'],
};

export default nextConfig;
```

**この問題の重要性**:
- この問題が解決するまで、スマホで一切JavaScriptが動かなかった
- ボタンクリック、フォーム送信、React stateの更新すべてが機能しなかった
- **これが解決した瞬間に全ての機能が動き出した**

**ユーザーの反応**:
> やった！両方いけた！赤ボタン押せてログインもできた！！！

---

### 問題4: Safariのフォーム入力とstate管理の競合
**症状**:
- Safariでログインフォームにstateではなくrefを使用する必要があった
- state更新がうまく反映されない

**原因**:
- SafariとNext.jsのSSR/CSRハイドレーションの相性問題
- stateの更新タイミングとフォーム送信のタイミングがずれる

**解決策**:
`useState`から`useRef`に変更

**修正ファイル**: `app/auth/login/page.tsx`

```typescript
// 修正前
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// 修正後
const emailRef = useRef<HTMLInputElement>(null);
const passwordRef = useRef<HTMLInputElement>(null);

const handleSubmit = async (e?: any) => {
  const emailValue = emailRef.current?.value.trim() || '';
  const passwordValue = passwordRef.current?.value || '';
  // ...
};
```

---

## UI/UX関連

### 問題5: ダークモードでテキストが見えない
**症状**:
- ダークモードで人物一覧のテーブル、カレンダーのテキストが黒背景に黒文字で読めない

**原因**:
- Tailwind CSSのダークモードクラス（`dark:`）が未指定
- ライトモード用の色だけが設定されていた

**解決策**:
全てのテキストと背景に`dark:`プレフィックス付きクラスを追加

**修正例**:
```tsx
// 修正前
<td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">

// 修正後
<td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
```

**修正ファイル**:
- `app/people/page.tsx`
- `app/people/[id]/page.tsx`
- `components/Calendar.tsx`

**修正箇所**:
- カレンダーのカテゴリー色: `text-pink-900` → `text-pink-900 dark:text-pink-100`
- 人物一覧のテーブル: すべてのセルに`dark:text-gray-400`を追加
- ステータスバッジ: `bg-red-100 text-red-800` → `bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200`

---

### 問題6: カレンダーでの名前増殖バグ
**症状**:
- 11/4にEさんを登録、次回接触11/7に設定
- 11/7に接触完了を押すと、11/4にもEさんが表示される（増殖）
- 同じ日に同じ人物が複数表示される

**原因**:
- 接触履歴（contact）とリマインダー（reminder）が同じ日に両方表示されていた
- 同じ日・同じ人物の接触履歴が複数登録された場合の制御がなかった

**解決策**:
1. 同じ日に接触履歴がある場合、リマインダーを表示しない
2. 同じ日・同じ人物の接触履歴は最新の1件のみ表示

**修正ファイル**: `components/Calendar.tsx`

```typescript
// 接触履歴をチェック
const hasContactOnThisDate = personContacts.some(contact =>
  isSameDay(contact.contactDate, date)
);

// リマインダー表示の条件に追加
if (reminder?.isScheduled && person.scheduledDate && !hasContactOnThisDate) {
  // 接触履歴がある日はリマインダーを表示しない
}

// 接触履歴は最新の1件のみ表示
const contactsOnThisDate = personContacts.filter(contact =>
  isSameDay(contact.contactDate, date)
);
if (contactsOnThisDate.length > 0) {
  const latestContact = contactsOnThisDate.reduce((latest, current) =>
    current.createdAt > latest.createdAt ? current : latest
  );
  // 最新の1件のみ追加
}
```

---

### 問題7: ログアウトボタンが表示されない
**症状**:
- PCでログアウトボタンが表示されない
- `userEmail`が取得できていない

**原因**:
- `userEmail && (...)`の条件で、メールアドレス取得前はボタンが表示されない
- セッション取得が非同期で遅延する場合がある

**解決策**:
ログアウトボタンを常に表示、メールアドレスのみ条件付き表示

**修正ファイル**: `components/Navigation.tsx`

```tsx
// 修正前
{userEmail && (
  <>
    <span>{userEmail}</span>
    <button onClick={handleLogout}>ログアウト</button>
  </>
)}

// 修正後
{userEmail && (
  <span>{userEmail}</span>
)}
<button onClick={handleLogout}>ログアウト</button>
```

---

## データ管理関連

### 問題8: 最初の接触履歴が削除できてしまう
**症状**:
- 人物登録時の初回接触日が削除できてしまう
- 削除すると、その人物の「最初に会った日」が不明になる

**要件**:
- 初回接触日は削除不可にしたい（編集は可能）
- 2回目以降の接触履歴は削除可能

**解決策**:
1. 削除ボタンを条件付きで表示（最古の接触履歴には表示しない）
2. 削除処理で最古の接触履歴かチェック
3. 最古の場合はアラート表示

**修正ファイル**:
- `app/people/[id]/page.tsx`
- `app/page.tsx`

```typescript
const handleDeleteContact = (contactId: string) => {
  if (contacts.length > 0) {
    const oldestContact = contacts[contacts.length - 1];
    if (contactId === oldestContact.id) {
      alert('最初の接触履歴は削除できません');
      return;
    }
  }

  if (confirm('この接触履歴を削除しますか？')) {
    deleteContact(contactId);
  }
};
```

```tsx
// UIで削除ボタンを条件付き表示
{contacts.map((contact, index) => {
  const isFirstContact = index === contacts.length - 1;
  return (
    <div>
      {/* ... */}
      {!isFirstContact && (
        <button onClick={() => handleDeleteContact(contact.id)}>✕</button>
      )}
    </div>
  );
})}
```

---

## モジュール・ビルド関連

### 問題9: VoiceInput/CameraOCR削除後もエラーが残る
**症状**:
- `components/VoiceInput.tsx`と`components/CameraOCR.tsx`を削除
- インポート文も削除
- しかし、サーバー起動時に「Module not found」エラーが続く

**エラーメッセージ**:
```
Error: Module not found: Can't resolve '@/components/VoiceInput'
Error: Module not found: Can't resolve '@/components/CameraOCR'
```

**原因**:
- `.next`ディレクトリにキャッシュが残っている
- Next.js Turbopackがモジュール解決をキャッシュしている

**解決策**:
1. サーバーを停止
2. `.next`ディレクトリを削除
3. サーバーを再起動

```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```

**複数回の試行が必要だった理由**:
- 最初の削除では一部のプロセスが残っていた
- force killと複数回のキャッシュクリアが必要だった

---

### 問題10: テストライブラリの依存関係エラー
**症状**:
- `tesseract.js`（OCRライブラリ）をアンインストールしたい
- npm uninstallが成功しても、package.jsonに残る場合があった

**解決策**:
```bash
npm uninstall tesseract.js
```

**確認方法**:
```bash
cat package.json | grep tesseract
```

---

## 技術的な学び

### 学び1: Next.js 16 + Turbopackのセキュリティ制限
- IPアドレス経由でのHMRは明示的に許可が必要
- `allowedDevOrigins`の設定が必須
- これを知らないと、モバイル開発で詰まる

### 学び2: SafariのCookie制限
- IPアドレスドメインではCookieが保存されない
- LocalStorageを使う必要がある
- モバイル対応では必ず考慮すべき

### 学び3: Supabaseの認証方式の選択
- `@supabase/ssr`: サーバーサイド、Cookieベース、Next.js最適化
- `@supabase/supabase-js`: クライアントサイド、LocalStorage、汎用的
- 開発環境の要件に応じて適切に選択

### 学び4: ダークモードの徹底的な対応
- 全てのテキスト、背景、ボーダーに`dark:`クラスが必要
- 見落としがあると一部が読めなくなる
- 最初から全画面で対応するのが効率的

### 学び5: カレンダーUIでの重複表示の制御
- 予定（リマインダー）と実績（接触履歴）の表示ロジックを明確に
- 同じ日・同じ人物は1回のみ表示
- 重複チェックのロジックが重要

---

## エラー頻度と重要度

### 🔴 クリティカル（システムが動かない）
1. **Cross-Origin HMR blocking** - これが解決するまでスマホで一切動作しなかった
2. **Safari Cookie issue** - モバイル認証が完全に機能しなかった

### 🟡 高（機能が使えない）
3. **Middleware blocking** - ログイン後に画面が進まない
4. **Module cache issues** - サーバー起動時にエラー

### 🟢 中（UX問題）
5. **Dark mode text visibility** - ダークモードで読めない
6. **Calendar name duplication** - 名前が増殖する
7. **Logout button missing** - ログアウトボタンが表示されない

### 🔵 低（データ整合性）
8. **First contact deletion** - 最初の接触履歴が削除できてしまう

---

## 解決までの試行回数

| 問題 | 試行回数 | 所要時間 |
|------|----------|----------|
| Cross-Origin HMR | 5回 | 30分 |
| Safari Cookie | 3回 | 20分 |
| Middleware blocking | 2回 | 10分 |
| Module cache | 4回 | 15分 |
| Dark mode | 1回 | 10分 |
| Calendar duplication | 2回 | 15分 |
| Logout button | 1回 | 5分 |
| First contact deletion | 1回 | 10分 |

---

## 開発のターニングポイント

### ターニングポイント1: allowedDevOrigins の発見
**before**: スマホで何も動かない、原因不明
**after**: 全ての機能が一気に動作開始

### ターニングポイント2: LocalStorage認証への切り替え
**before**: モバイルでログインできない
**after**: PC・モバイル両方で認証成功

### ターニングポイント3: 音声・カメラ機能の削除
**before**: 機能が不完全、エラーが多い
**after**: シンプルで安定したシステムに

---

## 今後の開発で注意すべき点

1. **IPアドレス開発時は必ず`allowedDevOrigins`を設定**
2. **モバイル対応ではLocalStorage認証を検討**
3. **ダークモード対応は最初から全画面で実装**
4. **キャッシュクリアを忘れずに（特に.nextディレクトリ）**
5. **重複表示のロジックは慎重に設計**
6. **削除機能には必ず確認ダイアログを実装**
7. **Safari固有の問題を常に意識**

---

**作成日**: 2024年11月
**最終更新**: 2024年11月
