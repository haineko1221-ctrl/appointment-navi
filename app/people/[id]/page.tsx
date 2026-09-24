'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Person, Contact } from '@/types';
import { getPersonById, getContactsByPersonId, saveContact, deleteContact } from '@/lib/storage';
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
    deleteContact(contactId);
    loadData();
  };

  if (!person) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const reminder = calculateReminder(person);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{person.name}</h1>
        <Button variant="secondary" onClick={() => router.back()}>
          戻る
        </Button>
      </div>

      <Card title="📋 基本情報">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">カテゴリー</p>
            <p className="font-semibold">
              {person.category === 'follow' ? '👥 フォロー' : '📅 アポイント'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">フォロー間隔</p>
            <p className="font-semibold">
              {person.followInterval ? `${person.followInterval}日ごと` : 'リマインドなし'}
            </p>
          </div>
          {person.memo && (
            <div className="col-span-2">
              <p className="text-gray-600 mb-2">個人情報メモ</p>
              <p className="font-semibold whitespace-pre-wrap">{person.memo}</p>
            </div>
          )}
        </div>
      </Card>

      <Card title="🔔 リマインド状況">
        <div className={`rounded-lg p-4 ${
          reminder.isOverdue
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          {reminder.lastContact ? (
            <>
              <p className="text-sm text-gray-600 mb-2">
                最終接触: {formatDate(reminder.lastContact.contactDate)}
                　（{reminder.daysElapsed}日経過）
              </p>
              <p className={`text-sm font-semibold ${
                reminder.isOverdue ? 'text-red-600' : 'text-blue-600'
              }`}>
                {reminder.isOverdue
                  ? `🔴 ${reminder.daysOverdue}日遅れています`
                  : `次回推奨: ${formatDate(reminder.nextRecommendedDate)}`
                }
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              まだ接触履歴がありません
            </p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        接触日
                      </label>
                      <input
                        type="date"
                        value={contactDate}
                        onChange={(e) => setContactDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        実際に接触した日（昨日なども選択可能）
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        アクション内容
                      </label>
                      <input
                        type="text"
                        value={contactNote}
                        onChange={(e) => setContactNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: 電話で連絡、LINEでメッセージ、実際に面談"
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
        </div>
      </Card>

      <Card title="📝 接触履歴">
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            接触履歴がありません
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="border-l-4 border-blue-500 pl-4 py-2 flex justify-between items-start"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(contact.contactDate)}
                  </p>
                  {contact.note && (
                    <p className="text-sm text-gray-600 mt-1">{contact.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {index === 0 ? '最新' : `${index + 1}回目`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="ml-4 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                  title="取り消す"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
