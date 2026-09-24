'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Person, PersonCategory, CATEGORY_LABELS } from '@/types';
import { savePerson, saveContact } from '@/lib/storage';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function NewPersonPage() {
  const router = useRouter();

  // 今日の日付を YYYY-MM-DD フォーマットで取得
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<{
    name: string;
    category: PersonCategory;
    followInterval: string;
    memo: string;
    initialContactDate: string;
  }>({
    name: '',
    category: 'follow',
    followInterval: '7',
    memo: '',
    initialContactDate: getTodayString(),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('名前を入力してください');
      return;
    }

    const followIntervalValue = formData.followInterval.trim() === ''
      ? null
      : parseInt(formData.followInterval);

    if (followIntervalValue !== null && followIntervalValue < 1) {
      alert('フォロー間隔は1日以上で入力してください');
      return;
    }

    const personId = uuidv4();
    const person: Person = {
      id: personId,
      name: formData.name,
      category: formData.category,
      followInterval: followIntervalValue,
      memo: formData.memo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    savePerson(person);

    // 初回接触日を履歴として保存
    const contactDate = new Date(formData.initialContactDate);
    saveContact({
      id: uuidv4(),
      personId: personId,
      contactDate: contactDate,
      createdAt: new Date(),
    });

    router.push('/people');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="👤 人物登録">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: 田中太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリー <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as PersonCategory })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {(Object.keys(CATEGORY_LABELS) as PersonCategory[]).map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category].emoji} {CATEGORY_LABELS[category].label} - {CATEGORY_LABELS[category].description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              フォロー間隔（日数）
            </label>
            <input
              type="text"
              value={formData.followInterval}
              onChange={(e) =>
                setFormData({ ...formData, followInterval: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="未入力の場合リマインドなし"
            />
            <p className="text-xs text-gray-500 mt-1">
              例: 3日ごとに連絡する場合は「3」と入力。空欄の場合はリマインド通知なし
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              初回接触日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.initialContactDate}
              onChange={(e) =>
                setFormData({ ...formData, initialContactDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              最初に接触した日（過去の日付も設定可能）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              個人情報メモ
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              placeholder="例: &#10;・会社: 〇〇株式会社&#10;・趣味: ゴルフ&#10;・家族構成: 妻、子供2人&#10;・最近の関心事: 副業に興味"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">
              登録
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
