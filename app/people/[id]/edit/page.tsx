'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Person, PersonCategory, CATEGORY_LABELS } from '@/types';
import { getPersonById, savePerson } from '@/lib/storage';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params.id as string;

  const [formData, setFormData] = useState<{
    name: string;
    category: PersonCategory;
    followInterval: string;
    memo: string;
  }>({
    name: '',
    category: 'follow',
    followInterval: '0',
    memo: '',
  });

  useEffect(() => {
    const person = getPersonById(personId);
    if (!person) {
      router.push('/people');
      return;
    }

    setFormData({
      name: person.name,
      category: person.category,
      followInterval: person.followInterval?.toString() || '0',
      memo: person.memo || '',
    });
  }, [personId, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('名前を入力してください');
      return;
    }

    const followIntervalValue = formData.followInterval.trim() === '' || formData.followInterval === '0'
      ? null
      : parseInt(formData.followInterval);

    if (followIntervalValue !== null && followIntervalValue < 1) {
      alert('フォロー間隔は1日以上で入力してください');
      return;
    }

    const person = getPersonById(personId);
    if (!person) {
      alert('人物が見つかりません');
      return;
    }

    const updatedPerson: Person = {
      ...person,
      name: formData.name,
      category: formData.category,
      followInterval: followIntervalValue,
      memo: formData.memo,
      updatedAt: new Date(),
    };

    savePerson(updatedPerson);
    router.push(`/people/${personId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="✏️ 人物情報編集">
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
              type="number"
              value={formData.followInterval}
              onChange={(e) =>
                setFormData({ ...formData, followInterval: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              例: 3日ごとに連絡する場合は「3」と入力。0の場合はリマインド通知なし
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
              保存
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
