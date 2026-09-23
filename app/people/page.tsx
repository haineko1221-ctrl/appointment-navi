'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Person } from '@/types';
import { getAllPeople, deletePerson } from '@/lib/storage';
import { calculateReminder, formatDate } from '@/lib/reminderCalculator';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);

  const loadData = () => {
    setPeople(getAllPeople());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name}さんを削除しますか？`)) {
      deletePerson(id);
      loadData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">👥 人物一覧</h1>
        <Link href="/people/new">
          <Button variant="primary">+ 人物を登録</Button>
        </Link>
      </div>

      {people.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">まだ登録されていません。</p>
            <Link href="/people/new">
              <Button variant="primary">最初の人物を登録</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => {
            const reminder = calculateReminder(person);
            return (
              <Card key={person.id}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      {person.name}
                    </h3>
                    {reminder.isOverdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                        遅延
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      フォロー間隔: {person.followInterval}日ごと
                    </p>
                    {reminder.lastContact ? (
                      <>
                        <p>
                          最終接触: {formatDate(reminder.lastContact.contactDate)}
                        </p>
                        <p>
                          経過日数: {reminder.daysElapsed}日
                        </p>
                        <p className={reminder.isOverdue ? 'text-red-600 font-semibold' : 'text-blue-600'}>
                          次回推奨: {formatDate(reminder.nextRecommendedDate)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">
                        まだ接触履歴がありません
                      </p>
                    )}
                    {person.memo && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 whitespace-pre-wrap">
                          {person.memo}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Link href={`/people/${person.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        詳細
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(person.id, person.name)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
