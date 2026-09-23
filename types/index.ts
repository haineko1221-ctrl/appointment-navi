// ===================================
// カテゴリー
// ===================================

export type PersonCategory = 'follow' | 'appointment';

export const CATEGORY_LABELS: Record<PersonCategory, { label: string; emoji: string; description: string }> = {
  follow: {
    label: 'フォロー',
    emoji: '👥',
    description: '既存メンバーへの定期接触',
  },
  appointment: {
    label: 'アポイント',
    emoji: '📅',
    description: '見込み客との新規アポイント',
  },
};

// ===================================
// 人物（アポイント対象者）
// ===================================

export type Person = {
  id: string;
  name: string;
  category: PersonCategory; // カテゴリー
  followInterval: number; // フォロー間隔（日数）
  memo?: string; // 個人情報メモ
  createdAt: Date;
  updatedAt: Date;
};

// ===================================
// 接触履歴
// ===================================

export type Contact = {
  id: string;
  personId: string; // 対象者ID
  contactDate: Date; // 接触日
  note?: string; // 接触内容メモ
  createdAt: Date;
};

// ===================================
// リマインド情報（表示用）
// ===================================

export type Reminder = {
  person: Person;
  lastContact: Contact | null;
  nextRecommendedDate: Date; // 次回推奨日
  daysElapsed: number; // 経過日数
  isOverdue: boolean; // 遅延しているか
  daysOverdue: number; // 遅延日数
};
