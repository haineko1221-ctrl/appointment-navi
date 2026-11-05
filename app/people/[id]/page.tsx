'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Person, Contact } from '@/types';
import { getPersonById, getContactsByPersonId, saveContact, deleteContact, savePerson } from '@/lib/storage';
import { calculateReminder, formatDate } from '@/lib/reminderCalculator';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
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

  const loadData = () => {
    const loadedPerson = getPersonById(personId);
    if (!loadedPerson) {
      router.push('/people');
      return;
    }

    const loadedContacts = getContactsByPersonId(personId);
    setPerson(loadedPerson);
    setContacts(loadedContacts);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const handleContactClick = () => {
    setContactDate(getTodayString());
    setShowContactForm(true);
  };

  const handleContactSubmit = () => {
    const selectedDate = new Date(contactDate);
    saveContact({
      id: uuidv4(),
      personId,
      contactDate: selectedDate,
      note: contactNote.trim() || undefined,
      createdAt: new Date(),
    });

    // 新規アポ予定だった場合、scheduledDateをクリア
    if (person?.scheduledDate) {
      savePerson({
        ...person,
        scheduledDate: undefined,
        updatedAt: new Date(),
      });
    }

    setContactNote('');
    setContactDate('');
    setShowContactForm(false);
    loadData();
  };

  const handleContactCancel = () => {
    setContactNote('');
    setContactDate('');
    setShowContactForm(false);
  };

  const handleDeleteContact = (contactId: string) => {
    // 最初の接触履歴（最も古い接触履歴）は削除できない
    if (contacts.length > 0) {
      const oldestContact = contacts[contacts.length - 1];
      if (contactId === oldestContact.id) {
        alert('最初の接触履歴は削除できません');
        return;
      }
    }

    if (confirm('この接触履歴を削除しますか？')) {
      deleteContact(contactId);
      loadData();
    }
  };

  if (!person) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const reminder = calculateReminder(person);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{person.name}</h1>
        <div className="flex gap-2">
          <Link href={`/people/${person.id}/edit`}>
            <Button variant="primary">
              編集
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => router.back()}>
            戻る
          </Button>
        </div>
      </div>

      <Card title="📋 基本情報">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">カテゴリー</p>
            <p className="font-semibold dark:text-gray-100">
              {person.category === 'follow' ? '👥 フォロー' : '📅 アポイント'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">フォロー間隔</p>
            <p className="font-semibold dark:text-gray-100">
              {person.followInterval ? `${person.followInterval}日ごと` : 'リマインドなし'}
            </p>
          </div>
          {person.memo && (
            <div className="col-span-2">
              <p className="text-gray-600 dark:text-gray-400 mb-2">個人情報メモ</p>
              <p className="font-semibold dark:text-gray-100 whitespace-pre-wrap">{person.memo}</p>
            </div>
          )}
        </div>
      </Card>

      <Card title="🔔 リマインド状況">
        {!reminder ? (
          <div className="rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              この人物はリマインド設定がありません（スケジュール帳モード）
            </p>
          </div>
        ) : (
          <div className={`rounded-lg p-4 ${
            reminder.isOverdue
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            {reminder.lastContact ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  最終接触: {formatDate(reminder.lastContact.contactDate)}
                  　（{reminder.daysElapsed}日経過）
                </p>
                <p className={`text-sm font-semibold ${
                  reminder.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {reminder.isOverdue
                    ? `🔴 ${reminder.daysOverdue}日遅れています`
                    : `次回推奨: ${formatDate(reminder.nextRecommendedDate)}`
                  }
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                まだ接触履歴がありません
              </p>
            )}
          </div>
        )}

        <div className="mt-4">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todayContact = contacts.find(c => {
                const contactDate = new Date(c.contactDate);
                contactDate.setHours(0, 0, 0, 0);
                return contactDate.getTime() === today.getTime();
              });

              if (todayContact) {
                return (
                  <Button variant="secondary" onClick={() => handleDeleteContact(todayContact.id)}>
                    取り消す
                  </Button>
                );
              }

              if (showContactForm) {
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <Button variant="primary" onClick={handleContactSubmit}>
                        記録する
                      </Button>
                      <Button variant="secondary" onClick={handleContactCancel}>
                        キャンセル
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <Button variant="primary" onClick={handleContactClick}>
                  接触完了
                </Button>
              );
            })()}
          </div>
      </Card>

      <Card title="📝 接触履歴">
        {contacts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            接触履歴がありません
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, index) => {
              const isFirstContact = index === contacts.length - 1;
              return (
                <div
                  key={contact.id}
                  className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(contact.contactDate)}
                    </p>
                    {contact.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{contact.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {index === 0 ? '最新' : isFirstContact ? '最初の接触' : `${index + 1}回目`}
                    </p>
                  </div>
                  {!isFirstContact && (
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="ml-4 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="取り消す"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
