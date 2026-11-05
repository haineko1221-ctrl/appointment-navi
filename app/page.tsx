'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Reminder, PersonCategory, CATEGORY_LABELS } from '@/types';
import { getAllPeople, saveContact, deleteContact, savePerson, getPersonById, getContactsByPersonId } from '@/lib/storage';
import { getTodayReminders, getOverdueReminders, formatDate } from '@/lib/reminderCalculator';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Calendar, { CalendarItem } from '@/components/Calendar';

export default function Dashboard() {
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<Reminder[]>([]);
  const [selectedAllItems, setSelectedAllItems] = useState<CalendarItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PersonCategory | 'all'>('all');
  const [contactFormPersonId, setContactFormPersonId] = useState<string | null>(null);
  const [contactNote, setContactNote] = useState('');
  const [contactDate, setContactDate] = useState('');

  // 今日の日付を YYYY-MM-DD フォーマットで取得
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadReminders = () => {
    const allPeople = getAllPeople();
    const people = selectedCategory === 'all'
      ? allPeople
      : allPeople.filter(p => p.category === selectedCategory);
    setTodayReminders(getTodayReminders(people));
    setOverdueReminders(getOverdueReminders(people));
  };

  useEffect(() => {
    loadReminders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleContactClick = (personId: string) => {
    setContactFormPersonId(personId);
    setContactDate(getTodayString());
  };

  const handleContactSubmit = () => {
    if (!contactFormPersonId) return;

    const selectedDate = new Date(contactDate);
    saveContact({
      id: uuidv4(),
      personId: contactFormPersonId,
      contactDate: selectedDate,
      note: contactNote.trim() || undefined,
      createdAt: new Date(),
    });

    // 新規アポ予定だった場合、scheduledDateをクリア
    const person = getPersonById(contactFormPersonId);
    if (person?.scheduledDate) {
      savePerson({
        ...person,
        scheduledDate: undefined,
        updatedAt: new Date(),
      });
    }

    setContactNote('');
    setContactDate('');
    setContactFormPersonId(null);
    loadReminders();
  };

  const handleContactCancel = () => {
    setContactNote('');
    setContactDate('');
    setContactFormPersonId(null);
  };

  const handleDateClick = (date: Date, reminders: Reminder[], allItems: CalendarItem[]) => {
    setSelectedDate(date);
    setSelectedReminders(reminders);
    setSelectedAllItems(allItems);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedReminders([]);
    setSelectedAllItems([]);
    loadReminders();
  };

  const handleDeleteContact = (contactId: string, personId: string) => {
    // その人物の全接触履歴を取得して確認
    const contacts = getContactsByPersonId(personId);

    if (contacts.length > 0) {
      const oldestContact = contacts[contacts.length - 1];
      if (contactId === oldestContact.id) {
        alert('最初の接触履歴は削除できません');
        return;
      }
    }

    if (confirm('この接触履歴を削除しますか？')) {
      deleteContact(contactId);
      loadReminders();
      // モーダル内の表示を更新
      setSelectedAllItems(prev => prev.filter(item => item.contact?.id !== contactId));
    }
  };

  const allPeople = getAllPeople();
  const filteredPeople = selectedCategory === 'all'
    ? allPeople
    : allPeople.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
          📅 ダッシュボード
        </h1>
        <Link href="/people/new">
          <Button variant="primary" size="sm" className="whitespace-nowrap text-xs sm:text-sm">+ 人物を登録</Button>
        </Link>
      </div>

      {/* カテゴリーフィルター */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          📋 全て
        </button>
        {(Object.keys(CATEGORY_LABELS) as PersonCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {CATEGORY_LABELS[category].emoji} {CATEGORY_LABELS[category].label}
          </button>
        ))}
      </div>

      {/* カレンダー表示 */}
      <div className="-mx-4 sm:mx-0">
        <Calendar people={filteredPeople} onDateClick={handleDateClick} />
      </div>

      {todayReminders.length === 0 && overdueReminders.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              今日のリマインドはありません。
            </p>
            <Link href="/people/new">
              <Button variant="primary">最初の人物を登録</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {overdueReminders.length > 0 && (
            <Card title={`⚠️ 遅延中 ${overdueReminders.length}件`}>
              <div className="space-y-4">
                {overdueReminders.map((reminder) => (
                  <div
                    key={reminder.person.id}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {reminder.person.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          設定間隔: {reminder.person.followInterval ? `${reminder.person.followInterval}日ごと` : 'リマインドなし'}
                        </p>
                        {reminder.lastContact ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            最終接触: {formatDate(reminder.lastContact.contactDate)}
                            　（{reminder.daysElapsed}日経過）
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            まだ接触履歴がありません
                          </p>
                        )}
                        <p className="text-sm text-red-600 dark:text-red-400 font-semibold mt-1">
                          🔴 {reminder.daysOverdue}日遅れています
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleContactClick(reminder.person.id)}
                      >
                        接触完了
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {todayReminders.length > 0 && (
            <Card title={`🔔 今日のリマインド ${todayReminders.length}件`}>
              <div className="space-y-4">
                {todayReminders.map((reminder) => (
                  <div
                    key={reminder.person.id}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {reminder.person.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          設定間隔: {reminder.person.followInterval ? `${reminder.person.followInterval}日ごと` : 'リマインドなし'}
                        </p>
                        {reminder.lastContact ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            最終接触: {formatDate(reminder.lastContact.contactDate)}
                            　（{reminder.daysElapsed}日経過）
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            まだ接触履歴がありません
                          </p>
                        )}
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">
                          次回推奨: {formatDate(reminder.nextRecommendedDate)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleContactClick(reminder.person.id)}
                      >
                        接触完了
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* 日付クリック時のモーダル */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-gray-100">
                {formatDate(selectedDate)} の予定
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            {selectedAllItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                この日の予定はありません
              </p>
            ) : (
              <div className="space-y-4">
                {selectedAllItems.map((item, index) => {
                  const isContact = item.type === 'contact';

                  return (
                    <div
                      key={`${item.person.id}-${item.type}-${index}`}
                      className={`border rounded-lg p-4 ${
                        isContact
                          ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 opacity-75'
                          : item.isOverdue
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">
                              {isContact ? '✓' : item.isOverdue ? '🔴' : '🔵'}
                            </span>
                            <h3 className={`text-lg font-bold ${isContact ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              <Link href={`/people/${item.person.id}/edit`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                {item.person.name}
                              </Link>
                            </h3>
                            {isContact && (
                              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded">
                                接触完了
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            設定間隔: {item.person.followInterval ? `${item.person.followInterval}日ごと` : 'リマインドなし'}
                          </p>

                          {!isContact && item.reminder?.lastContact && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              最終接触: {formatDate(item.reminder.lastContact.contactDate)}
                              　（{item.reminder.daysElapsed}日経過）
                            </p>
                          )}

                          {!isContact && !item.reminder?.lastContact && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              まだ接触履歴がありません
                            </p>
                          )}

                          {item.isOverdue && !isContact && (
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold mt-1">
                              🔴 {item.reminder!.daysOverdue}日遅れています
                            </p>
                          )}

                          {isContact && item.contact?.note && (
                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📝 アクション内容:</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {item.contact.note}
                              </p>
                            </div>
                          )}

                          {!isContact && item.person.memo && (
                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {item.person.memo}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {isContact ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeleteContact(item.contact!.id, item.person.id)}
                            >
                              取り消す
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                closeModal();
                                handleContactClick(item.person.id);
                              }}
                            >
                              接触完了
                            </Button>
                          )}
                          <Link href={`/people/${item.person.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              編集
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 接触記録入力モーダル */}
      {contactFormPersonId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleContactCancel}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-gray-100">
                接触記録
              </h2>
              <button
                onClick={handleContactCancel}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  接触日
                </label>
                <input
                  type="date"
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  実際に接触した日（昨日なども選択可能）
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  アクション内容
                </label>
                <input
                  type="text"
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 電話で連絡、LINEでメッセージ、実際に面談"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleContactSubmit();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  誰にどんなアクションをしたか記録しましょう
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" onClick={handleContactSubmit} className="flex-1">
                  記録する
                </Button>
                <Button variant="secondary" onClick={handleContactCancel}>
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
