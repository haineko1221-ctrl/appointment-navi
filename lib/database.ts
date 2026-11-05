'use server';

import { createClient } from '@/lib/supabase/server';
import { Person, Contact, PersonImage } from '@/types';

// ===================================
// ヘルパー関数: DBレコード → フロントエンド型変換
// ===================================

function dbPersonToPerson(dbPerson: any): Person {
  return {
    id: dbPerson.id,
    name: dbPerson.name,
    category: dbPerson.category,
    followInterval: dbPerson.follow_interval,
    scheduledDate: dbPerson.scheduled_date ? new Date(dbPerson.scheduled_date) : undefined,
    memo: dbPerson.memo || undefined,
    createdAt: new Date(dbPerson.created_at),
    updatedAt: new Date(dbPerson.updated_at),
  };
}

function dbContactToContact(dbContact: any): Contact {
  return {
    id: dbContact.id,
    personId: dbContact.person_id,
    contactDate: new Date(dbContact.contact_date),
    note: dbContact.note || undefined,
    createdAt: new Date(dbContact.created_at),
  };
}

function dbImageToPersonImage(dbImage: any): PersonImage {
  return {
    id: dbImage.id,
    personId: dbImage.person_id,
    storagePath: dbImage.storage_path,
    fileName: dbImage.file_name,
    fileSize: dbImage.file_size,
    mimeType: dbImage.mime_type,
    ocrText: dbImage.ocr_text || undefined,
    createdAt: new Date(dbImage.created_at),
  };
}

// ===================================
// 人物管理
// ===================================

export async function getAllPeople(): Promise<Person[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching people:', error);
    return [];
  }

  return (data || []).map(dbPersonToPerson);
}

export async function savePerson(person: Person): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbPerson = {
    id: person.id,
    user_id: user.id,
    name: person.name,
    category: person.category,
    follow_interval: person.followInterval,
    scheduled_date: person.scheduledDate?.toISOString() || null,
    memo: person.memo || null,
  };

  const { error } = await supabase
    .from('people')
    .upsert(dbPerson);

  if (error) {
    console.error('Error saving person:', error);
    throw error;
  }
}

export async function getPersonById(id: string): Promise<Person | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return dbPersonToPerson(data);
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Cascade deleteが設定されているため、関連するcontactsとimagesも自動削除される
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting person:', error);
    throw error;
  }
}

// ===================================
// 接触履歴管理
// ===================================

export async function getAllContacts(): Promise<Contact[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('contact_date', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  return (data || []).map(dbContactToContact);
}

export async function getContactsByPersonId(personId: string): Promise<Contact[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('person_id', personId)
    .eq('user_id', user.id)
    .order('contact_date', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  return (data || []).map(dbContactToContact);
}

export async function saveContact(contact: Contact): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbContact = {
    id: contact.id,
    person_id: contact.personId,
    user_id: user.id,
    contact_date: contact.contactDate.toISOString(),
    note: contact.note || null,
  };

  const { error } = await supabase
    .from('contacts')
    .insert(dbContact);

  if (error) {
    console.error('Error saving contact:', error);
    throw error;
  }
}

export async function getLastContact(personId: string): Promise<Contact | null> {
  const contacts = await getContactsByPersonId(personId);
  return contacts[0] || null;
}

export async function deleteContact(contactId: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}

// ===================================
// 画像管理（フェーズ2で使用）
// ===================================

export async function getImagesByPersonId(personId: string): Promise<PersonImage[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('person_id', personId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching images:', error);
    return [];
  }

  return (data || []).map(dbImageToPersonImage);
}

export async function saveImage(image: Omit<PersonImage, 'id' | 'createdAt'>): Promise<PersonImage> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbImage = {
    person_id: image.personId,
    user_id: user.id,
    storage_path: image.storagePath,
    file_name: image.fileName,
    file_size: image.fileSize,
    mime_type: image.mimeType,
    ocr_text: image.ocrText || null,
  };

  const { data, error } = await supabase
    .from('images')
    .insert(dbImage)
    .select()
    .single();

  if (error || !data) {
    console.error('Error saving image:', error);
    throw error || new Error('Failed to save image');
  }

  return dbImageToPersonImage(data);
}

export async function updateImageOcrText(imageId: string, ocrText: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('images')
    .update({ ocr_text: ocrText })
    .eq('id', imageId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating OCR text:', error);
    throw error;
  }
}

export async function deleteImage(imageId: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // まず画像情報を取得
  const { data: image, error: fetchError } = await supabase
    .from('images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !image) {
    throw fetchError || new Error('Image not found');
  }

  // Storageから画像ファイルを削除
  const { error: storageError } = await supabase.storage
    .from('person-images')
    .remove([image.storage_path]);

  if (storageError) {
    console.error('Error deleting from storage:', storageError);
  }

  // DBレコードを削除
  const { error: dbError } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', user.id);

  if (dbError) {
    console.error('Error deleting image record:', dbError);
    throw dbError;
  }
}
