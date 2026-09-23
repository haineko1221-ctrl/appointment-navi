'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Reminder, PersonCategory, CATEGORY_LABELS } from '@/types';
import { getAllPeople, saveContact, deleteContact } from '@/lib/storage';
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
  };

  const handleContactSubmit = () => {
    if (!contactFormPersonId) return;

    saveContact({
      id: uuidv4(),
      personId: contactFormPersonId,
      contactDate: new Date(),
      note: contactNote.trim() || undefined,
      createdAt: new Date(),
    });
    setContactNote('');
    setContactFormPersonId(null);
    loadReminders();
  };

  const handleContactCancel = () => {
    setContactNote('');
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

  const handleDeleteContact = (contactId: string) => {
    deleteContact(contactId);
    loadReminders();
    // モーダル内の表示を更新
    setSelectedAllItems(prev => prev.filter(item => item.contact?.id !== contactId));
  };

  const allPeople = getAllPeople();
  const filteredPeople = selectedCategory === 'all'
    ? allPeople
    : allPeople.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          📅 ダッシュボード
        </h1>
        <Link href="/people/new">
          <Button variant="primary">+ 人物を登録</Button>
        </Link>
      </div>

      {/* カテゴリーフィルター */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {CATEGORY_LABELS[category].emoji} {CATEGORY_LABELS[category].label}
          </button>
        ))}
      </div>

      {/* カレンダー表示 */}
      <Calendar people={filteredPeople} onDateClick={handleDateClick} />

      {todayReminders.length === 0 && overdueReminders.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
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
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {reminder.person.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          設定間隔: {reminder.person.followInterval}日ごと
                        </p>
                        {reminder.lastContact ? (
                          <p className="text-sm text-gray-600">
                            最終接触: {formatDate(reminder.lastContact.contactDate)}
                            　（{reminder.daysElapsed}日経過）
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">
                            まだ接触履歴がありません
                          </p>
                        )}
                        <p className="text-sm text-red-600 font-semibold mt-1">
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
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {reminder.person.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          設定間隔: {reminder.person.followInterval}日ごと
                        </p>
                        {reminder.lastContact ? (
                          <p className="text-sm text-gray-600">
                            最終接触: {formatDate(reminder.lastContact.contactDate)}
                            　（{reminder.daysElapsed}日経過）
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">
                            まだ接触履歴がありません
                          </p>
                        )}
                        <p className="text-sm text-blue-600 font-semibold mt-1">
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
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {formatDate(selectedDate)} の予定
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {selectedAllItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
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
                          ? 'bg-gray-50 border-gray-300 opacity-75'
                          : item.isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">
                              {isContact ? '✓' : item.isOverdue ? '🔴' : '🔵'}
                            </span>
                            <h3 className={`text-lg font-bold ${isContact ? 'text-gray-600' : 'text-gray-900'}`}>
                              {item.person.name}
                            </h3>
                            {isContact && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                                接触完了
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            設定間隔: {item.person.followInterval}日ごと
                          </p>

                          {!isContact && item.reminder?.lastContact && (
                            <p className="text-sm text-gray-600">
                              最終接触: {formatDate(item.reminder.lastContact.contactDate)}
                              　（{item.reminder.daysElapsed}日経過）
                            </p>
                          )}

                          {!isContact && !item.reminder?.lastContact && (
                            <p className="text-sm text-gray-600">
                              まだ接触履歴がありません
                            </p>
                          )}

                          {item.isOverdue && !isContact && (
                            <p className="text-sm text-red-600 font-semibold mt-1">
                              🔴 {item.reminder!.daysOverdue}日遅れています
                            </p>
                          )}

                          {isContact && item.contact?.note && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <p className="text-sm font-semibold text-gray-700 mb-1">📝 アクション内容:</p>
                              <p className="text-sm text-gray-900">
                                {item.contact.note}
                              </p>
                            </div>
                          )}

                          {!isContact && item.person.memo && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                {item.person.memo}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          {isContact ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeleteContact(item.contact!.id)}
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
            className="bg-white rounded-lg p-6 max-w-md w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                接触記録
              </h2>
              <button
                onClick={handleContactCancel}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アクション内容
                </label>
                <input
                  type="text"
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 電話で連絡、LINEでメッセージ、実際に面談"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleContactSubmit();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
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
