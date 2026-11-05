-- ===================================
-- 既存テーブル・ポリシー確認用SQL
-- ===================================
-- このSQLを実行して、現在のSupabaseの状態を確認してください
-- 結果をコピーして教えてください

-- 1. 既存テーブルの確認
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('people', 'contacts', 'images')
ORDER BY tablename;

-- 2. peopleテーブルの列構造（存在する場合）
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'people'
ORDER BY ordinal_position;

-- 3. contactsテーブルの列構造（存在する場合）
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contacts'
ORDER BY ordinal_position;

-- 4. imagesテーブルの列構造（存在する場合）
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'images'
ORDER BY ordinal_position;

-- 5. 既存のRLSポリシー確認
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('people', 'contacts', 'images')
ORDER BY tablename, policyname;
