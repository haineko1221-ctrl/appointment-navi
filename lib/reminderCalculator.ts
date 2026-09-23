import { Person, Contact, Reminder } from '@/types';
import { getLastContact } from './storage';

// ===================================
// 日付計算ユーティリティ
// ===================================

export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
}

// ===================================
// リマインド計算
// ===================================

export function calculateReminder(person: Person): Reminder {
  const lastContact = getLastContact(person.id);
  const today = getToday();

  if (!lastContact) {
    // 接触履歴がない場合は今日が推奨日
    return {
      person,
      lastContact: null,
      nextRecommendedDate: today,
      daysElapsed: 0,
      isOverdue: true,
      daysOverdue: 0,
    };
  }

  const lastContactDate = new Date(lastContact.contactDate);
  const nextRecommendedDate = addDays(lastContactDate, person.followInterval);
  const daysElapsed = daysBetween(lastContactDate, today);
  const daysOverdue = daysBetween(nextRecommendedDate, today);
  const isOverdue = daysOverdue > 0;

  return {
    person,
    lastContact,
    nextRecommendedDate,
    daysElapsed,
    isOverdue,
    daysOverdue: Math.max(0, daysOverdue),
  };
}

export function getAllReminders(people: Person[]): Reminder[] {
  return people.map(calculateReminder)
    .sort((a, b) => {
      // 遅延しているものを優先
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      // 同じ状態なら次回推奨日が早い順
      return a.nextRecommendedDate.getTime() - b.nextRecommendedDate.getTime();
    });
}

export function getTodayReminders(people: Person[]): Reminder[] {
  const today = getToday();
  return getAllReminders(people).filter((reminder) => {
    const nextDate = new Date(
      reminder.nextRecommendedDate.getFullYear(),
      reminder.nextRecommendedDate.getMonth(),
      reminder.nextRecommendedDate.getDate()
    );
    return nextDate.getTime() <= today.getTime();
  });
}

export function getOverdueReminders(people: Person[]): Reminder[] {
  return getAllReminders(people).filter((reminder) => reminder.isOverdue);
}
