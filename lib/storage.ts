import { Person, Contact } from '@/types';

const STORAGE_KEYS = {
  PEOPLE: 'appointment-navi:people',
  CONTACTS: 'appointment-navi:contacts',
} as const;

// ===================================
// ヘルパー関数
// ===================================

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value, (key, val) => {
      // Date型の復元
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        return new Date(val);
      }
      return val;
    });
  } catch {
    return fallback;
  }
}

// ===================================
// 人物管理
// ===================================

export function getAllPeople(): Person[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.PEOPLE);
  return parseJSON<Person[]>(data, []);
}

export function savePerson(person: Person): void {
  if (typeof window === 'undefined') return;
  const people = getAllPeople();
  const index = people.findIndex((p) => p.id === person.id);

  if (index >= 0) {
    people[index] = person;
  } else {
    people.push(person);
  }

  localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
}

export function getPersonById(id: string): Person | null {
  const people = getAllPeople();
  return people.find((p) => p.id === id) || null;
}

export function deletePerson(id: string): void {
  if (typeof window === 'undefined') return;
  const people = getAllPeople().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));

  // 関連する接触履歴も削除
  const allContacts = getAllContacts();
  const filteredContacts = allContacts.filter((c) => c.personId !== id);
  localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(filteredContacts));
}

// ===================================
// 接触履歴管理
// ===================================

export function getAllContacts(): Contact[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
  return parseJSON<Contact[]>(data, []);
}

export function getContactsByPersonId(personId: string): Contact[] {
  const allContacts = getAllContacts();
  return allContacts.filter((c) => c.personId === personId)
    .sort((a, b) => b.contactDate.getTime() - a.contactDate.getTime());
}

export function saveContact(contact: Contact): void {
  if (typeof window === 'undefined') return;
  const contacts = getAllContacts();
  contacts.push(contact);
  localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
}

export function getLastContact(personId: string): Contact | null {
  const contacts = getContactsByPersonId(personId);
  return contacts[0] || null;
}

export function deleteContact(contactId: string): void {
  if (typeof window === 'undefined') return;
  const contacts = getAllContacts().filter((c) => c.id !== contactId);
  localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
}
