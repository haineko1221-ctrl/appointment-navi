'use client';

import { useState } from 'react';
import { Person, Reminder, Contact } from '@/types';
import { calculateReminder, formatDate } from '@/lib/reminderCalculator';
import { getAllContacts } from '@/lib/storage';

type CalendarProps = {
  people: Person[];
  onDateClick?: (date: Date, reminders: Reminder[], allItems: CalendarItem[]) => void;
};

export type CalendarItem = {
  person: Person;
  date: Date;
  type: 'reminder' | 'contact';
  reminder?: Reminder;
  contact?: Contact;
  isOverdue?: boolean;
};

// 人物ごとに色を割り当て
const PERSON_COLORS = [
  'bg-blue-100 border-blue-500 text-blue-900',
  'bg-green-100 border-green-500 text-green-900',
  'bg-purple-100 border-purple-500 text-purple-900',
  'bg-pink-100 border-pink-500 text-pink-900',
  'bg-yellow-100 border-yellow-500 text-yellow-900',
  'bg-orange-100 border-orange-500 text-orange-900',
  'bg-red-100 border-red-500 text-red-900',
  'bg-indigo-100 border-indigo-500 text-indigo-900',
];

export default function Calendar({ people, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getToday = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const today = getToday();

  // 月の初日を取得
  const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // 月の最終日を取得
  const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // カレンダー表示用の日付配列を生成（日曜始まり）
  const generateCalendarDays = (): (Date | null)[] => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);
    const days: (Date | null)[] = [];

    // 月初の曜日（0=日曜、6=土曜）
    const firstDayOfWeek = firstDay.getDay();

    // 前月の空白を追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // 当月の日付を追加
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    return days;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // 特定の日付のリマインドと接触履歴を取得
  const getItemsForDate = (date: Date): CalendarItem[] => {
    const items: CalendarItem[] = [];
    const allContacts = getAllContacts();

    people.forEach((person) => {
      const reminder = calculateReminder(person);

      // 次回推奨日をチェック
      if (isSameDay(reminder.nextRecommendedDate, date)) {
        items.push({
          person,
          date: reminder.nextRecommendedDate,
          type: 'reminder',
          reminder,
          isOverdue: reminder.isOverdue,
        });
      }

      // 接触履歴をチェック
      const personContacts = allContacts.filter(c => c.personId === person.id);
      personContacts.forEach(contact => {
        if (isSameDay(contact.contactDate, date)) {
          items.push({
            person,
            date: contact.contactDate,
            type: 'contact',
            contact,
          });
        }
      });
    });

    return items;
  };

  // Reminder配列を返す（モーダル用）
  const getRemindersForDate = (date: Date): Reminder[] => {
    const items = getItemsForDate(date);
    return items
      .filter(item => item.type === 'reminder' && item.reminder)
      .map(item => item.reminder!);
  };

  // 人物IDから色を取得
  const getPersonColor = (personId: string): string => {
    const personIndex = people.findIndex((p) => p.id === personId);
    return PERSON_COLORS[personIndex % PERSON_COLORS.length];
  };

  // 前月へ
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  // 次月へ
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // 今月へ
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={previousMonth}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          ← 前月
        </button>
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            今日
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          次月 →
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center font-bold py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded" />;
          }

          const items = getItemsForDate(date);
          const reminders = getRemindersForDate(date);
          const isToday = isSameDay(date, today);

          return (
            <div
              key={index}
              onClick={() => onDateClick && onDateClick(date, reminders, items)}
              className={`h-24 border-2 rounded-lg p-2 cursor-pointer transition hover:shadow-md ${
                isToday
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {/* 日付 */}
              <div
                className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>

              {/* リマインド・接触履歴表示 */}
              <div className="space-y-1 overflow-y-auto max-h-14">
                {items.slice(0, 3).map((item, idx) => {
                  const isContact = item.type === 'contact';

                  // 接触完了はグレーアウト
                  const colorClass = isContact
                    ? 'bg-gray-100 border-gray-300 text-gray-500 opacity-60'
                    : getPersonColor(item.person.id);

                  const statusIcon = isContact
                    ? '✓'
                    : item.isOverdue
                    ? '🔴'
                    : '🔵';

                  const tooltipText = isContact
                    ? `${item.person.name} - 接触完了: ${formatDate(item.contact!.contactDate)}${item.contact!.note ? `\n${item.contact!.note}` : ''}`
                    : `${item.person.name} - ${item.person.followInterval}日ごと${item.isOverdue ? ` (${item.reminder!.daysOverdue}日遅れ)` : ''}`;

                  return (
                    <div
                      key={`${item.person.id}-${item.type}-${idx}`}
                      className={`text-xs px-1 py-0.5 rounded border-l-2 ${colorClass} ${isContact ? 'line-through' : ''}`}
                      title={tooltipText}
                    >
                      <div className="truncate">
                        {statusIcon} {item.person.name.slice(0, 4)}
                        {isContact && item.contact?.note && (
                          <span className="ml-1 text-[10px]">
                            {item.contact.note.slice(0, 6)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length > 3 && (
                  <div className="text-xs text-gray-500 font-semibold">
                    +{items.length - 3}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span>✓ 完了</span>
          <span>🔵 予定</span>
          <span>🔴 遅延</span>
        </div>
      </div>
    </div>
  );
}
