-- ===================================
-- アポイントナビ: Supabase データベース設定（安全版）
-- ===================================
-- このファイルをSupabase Console > SQL Editorで実行してください
-- 既存のテーブルがあっても安全に実行できます

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- People テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('follow', 'appointment')),
  follow_interval INTEGER,
  scheduled_date TIMESTAMPTZ,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Peopleテーブルのインデックス（既に存在する場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_people_user_id') THEN
    CREATE INDEX idx_people_user_id ON people(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_people_category') THEN
    CREATE INDEX idx_people_category ON people(category);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_people_scheduled_date') THEN
    CREATE INDEX idx_people_scheduled_date ON people(scheduled_date);
  END IF;
END $$;

-- ===================================
-- Contacts テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Contactsテーブルのインデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_person_id') THEN
    CREATE INDEX idx_contacts_person_id ON contacts(person_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_user_id') THEN
    CREATE INDEX idx_contacts_user_id ON contacts(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_contact_date') THEN
    CREATE INDEX idx_contacts_contact_date ON contacts(contact_date DESC);
  END IF;
END $$;

-- ===================================
-- Images テーブル（フェーズ2で使用）
-- ===================================
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  ocr_text TEXT, -- OCRで抽出したテキスト
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Imagesテーブルのインデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_images_person_id') THEN
    CREATE INDEX idx_images_person_id ON images(person_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_images_user_id') THEN
    CREATE INDEX idx_images_user_id ON images(user_id);
  END IF;
END $$;

-- ===================================
-- Row Level Security (RLS) ポリシー
-- ===================================

-- Peopleテーブル RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから再作成（安全）
DROP POLICY IF EXISTS "Users can view their own people" ON people;
CREATE POLICY "Users can view their own people"
  ON people FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own people" ON people;
CREATE POLICY "Users can insert their own people"
  ON people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own people" ON people;
CREATE POLICY "Users can update their own people"
  ON people FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own people" ON people;
CREATE POLICY "Users can delete their own people"
  ON people FOR DELETE
  USING (auth.uid() = user_id);

-- Contactsテーブル RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Imagesテーブル RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own images" ON images;
CREATE POLICY "Users can view their own images"
  ON images FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own images" ON images;
CREATE POLICY "Users can insert their own images"
  ON images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 🆕 UPDATE権限を追加（OCRテキスト更新用）
DROP POLICY IF EXISTS "Users can update their own images" ON images;
CREATE POLICY "Users can update their own images"
  ON images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own images" ON images;
CREATE POLICY "Users can delete their own images"
  ON images FOR DELETE
  USING (auth.uid() = user_id);

-- ===================================
-- 自動更新トリガー（updated_atの自動更新）
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_people_updated_at ON people;
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
