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

// カテゴリーごとに色を割り当て
const CATEGORY_COLORS = {
  follow: 'bg-pink-100 border-pink-400 text-pink-900',
  appointment: 'bg-cyan-100 border-cyan-400 text-cyan-900',
};

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

      // 次回推奨日をチェック（リマインダーがある場合のみ）
      if (reminder && isSameDay(reminder.nextRecommendedDate, date)) {
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

  // カテゴリーから色を取得
  const getCategoryColor = (category: 'follow' | 'appointment'): string => {
    return CATEGORY_COLORS[category];
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
    <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-3 sm:mb-4 gap-1">
        <button
          onClick={previousMonth}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-xs sm:text-sm whitespace-nowrap"
        >
          ← 前月
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-base sm:text-2xl font-bold whitespace-nowrap">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition whitespace-nowrap"
          >
            今日
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-xs sm:text-sm whitespace-nowrap"
        >
          次月 →
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs sm:text-sm font-bold py-1 border-b border-gray-200 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-20 sm:h-24 bg-gray-50 border border-gray-200" />;
          }

          const items = getItemsForDate(date);
          const reminders = getRemindersForDate(date);
          const isToday = isSameDay(date, today);

          return (
            <div
              key={index}
              onClick={() => onDateClick && onDateClick(date, reminders, items)}
              className={`h-20 sm:h-24 border border-gray-200 p-0.5 cursor-pointer transition hover:bg-gray-50 ${
                isToday
                  ? 'bg-blue-50'
                  : 'bg-white'
              }`}
            >
              {/* 日付 */}
              <div
                className={`text-xs text-right pr-1 mb-0.5 ${
                  isToday ? 'text-blue-600 font-bold' : 'text-gray-600'
                }`}
              >
                {date.getDate()}
              </div>

              {/* リマインド・接触履歴表示 */}
              <div className="space-y-0.5 overflow-y-auto max-h-[68px] sm:max-h-[80px] px-0.5">
                {items.slice(0, 4).map((item, idx) => {
                  const isContact = item.type === 'contact';

                  // リマインドは黄色、接触完了はカテゴリー色
                  const colorClass = isContact
                    ? getCategoryColor(item.person.category)
                    : 'bg-yellow-100 border-yellow-400 text-yellow-900';

                  const tooltipText = isContact
                    ? `${item.person.name} - 接触完了: ${formatDate(item.contact!.contactDate)}${item.contact!.note ? `\n${item.contact!.note}` : ''}`
                    : `${item.person.name}${item.person.followInterval ? ` - ${item.person.followInterval}日ごと` : ''}${item.isOverdue ? ` (${item.reminder!.daysOverdue}日遅れ)` : ''}`;

                  return (
                    <div
                      key={`${item.person.id}-${item.type}-${idx}`}
                      className={`text-[8px] sm:text-[10px] px-0.5 py-0.5 rounded border-l-2 ${colorClass}`}
                      title={tooltipText}
                    >
                      <div className="truncate">
                        {item.person.name.slice(0, 8)}
                        {isContact && item.contact?.note && (
                          <span className="ml-0.5 text-[7px] sm:text-[9px]">
                            ({item.contact.note.slice(0, 6)})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length > 4 && (
                  <div className="text-[8px] sm:text-[10px] text-gray-500 font-semibold pl-0.5">
                    +{items.length - 4}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-l-2 border-yellow-400 rounded"></div>
          <span>予定</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-100 border-l-2 border-pink-400 rounded"></div>
          <span>フォロー</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cyan-100 border-l-2 border-cyan-400 rounded"></div>
          <span>アポイント</span>
        </div>
      </div>
    </div>
  );
}
