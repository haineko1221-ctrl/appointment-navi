'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Person, Reminder } from '@/types';
import { getAllPeople, deletePerson } from '@/lib/storage';
import { calculateReminder, formatDate } from '@/lib/reminderCalculator';
import Card from '@/components/Card';
import Button from '@/components/Button';

type SortKey = 'name' | 'category' | 'followInterval' | 'lastContact' | 'nextRecommended' | 'overdue';
type SortDirection = 'asc' | 'desc';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortedPeople = () => {
    const peopleWithReminders = people.map(person => ({
      person,
      reminder: calculateReminder(person),
    }));

    return peopleWithReminders.sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'name':
          comparison = a.person.name.localeCompare(b.person.name, 'ja');
          break;
        case 'category':
          comparison = a.person.category.localeCompare(b.person.category);
          break;
        case 'followInterval':
          const aInterval = a.person.followInterval ?? -1;
          const bInterval = b.person.followInterval ?? -1;
          comparison = aInterval - bInterval;
          break;
        case 'lastContact':
          const aLastContact = a.reminder?.lastContact?.contactDate.getTime() ?? 0;
          const bLastContact = b.reminder?.lastContact?.contactDate.getTime() ?? 0;
          comparison = aLastContact - bLastContact;
          break;
        case 'nextRecommended':
          const aNext = a.reminder?.nextRecommendedDate.getTime() ?? Infinity;
          const bNext = b.reminder?.nextRecommendedDate.getTime() ?? Infinity;
          comparison = aNext - bNext;
          break;
        case 'overdue':
          const aOverdue = a.reminder?.isOverdue ? 1 : 0;
          const bOverdue = b.reminder?.isOverdue ? 1 : 0;
          comparison = bOverdue - aOverdue; // 遅延を先に
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <span className="text-gray-400">⇅</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      名前 <SortIcon columnKey="name" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      カテゴリー <SortIcon columnKey="category" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('followInterval')}
                  >
                    <div className="flex items-center gap-1">
                      間隔 <SortIcon columnKey="followInterval" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastContact')}
                  >
                    <div className="flex items-center gap-1">
                      最終接触 <SortIcon columnKey="lastContact" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('nextRecommended')}
                  >
                    <div className="flex items-center gap-1">
                      次回推奨 <SortIcon columnKey="nextRecommended" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('overdue')}
                  >
                    <div className="flex items-center gap-1">
                      状態 <SortIcon columnKey="overdue" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedPeople().map(({ person, reminder }) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/people/${person.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {person.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.category === 'follow' ? '👥 フォロー' : '📅 アポイント'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.followInterval ? `${person.followInterval}日` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reminder?.lastContact ? formatDate(reminder.lastContact.contactDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reminder ? formatDate(reminder.nextRecommendedDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reminder?.isOverdue ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          🔴 {reminder.daysOverdue}日遅れ
                        </span>
                      ) : reminder ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ 正常
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                          - リマインドなし
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/people/${person.id}`}>
                          <Button variant="primary" size="sm">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
