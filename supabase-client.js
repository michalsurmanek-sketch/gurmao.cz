// GURMAO.cz – shared Supabase client and compatibility helpers.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://jdprdcnxbxfzgrjjfflr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yVoMprXKwKGu1kIKc3p9ew_TQflIOib';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;
export { supabase };

function cleanText(value, max = 5000) {
  return String(value ?? '').normalize('NFKC').trim().slice(0, max);
}

async function requireUser(expectedUserId = null) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  if (expectedUserId && String(expectedUserId) !== user.id) throw new Error('User mismatch');
  return user;
}

async function resolveRestaurant(identifier) {
  const value = cleanText(identifier, 200);
  if (!value) throw new Error('Restaurant identifier is required');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const { data, error } = await supabase
    .from('restaurants')
    .select('id,slug,name')
    .eq(isUuid ? 'id' : 'slug', value)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Restaurant not found');
  return data;
}

// AUTH
export async function signUp(email, password, displayName = null) {
  const normalizedEmail = cleanText(email, 254).toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { display_name: cleanText(displayName || normalizedEmail.split('@')[0], 80) } }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanText(email, 254).toLowerCase(),
    password
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/feed.html` }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  localStorage.removeItem('gurmao_user');
  location.href = 'index.html';
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function isAuthenticated() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && Boolean(user);
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(cleanText(email, 254).toLowerCase(), {
    redirectTo: 'https://gurmao.cz/reset-password.html'
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  if (String(newPassword || '').length < 10) throw new Error('Heslo musí mít alespoň 10 znaků');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// PROFILE – compatibility helpers are always scoped to the current authenticated user.
export async function getUserProfile(userId = null) {
  const user = await requireUser(userId);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId, updates) {
  const user = await requireUser(userId);
  const safeUpdates = { ...updates };
  delete safeUpdates.id;
  delete safeUpdates.user_id;
  delete safeUpdates.email;
  delete safeUpdates.role;
  delete safeUpdates.created_at;
  const { data, error } = await supabase
    .from('profiles')
    .update(safeUpdates)
    .eq('id', user.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// RESTAURANTS
export async function getRestaurants(filters = {}) {
  const limit = Math.min(500, Math.max(1, Number(filters.limit) || 100));
  const offset = Math.max(0, Number(filters.offset) || 0);
  let query = supabase.from('restaurants').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (filters.vibe) query = query.ilike('vibe', `%${cleanText(filters.vibe, 40).replace(/[,%()]/g, '')}%`);
  if (filters.city) query = query.eq('city', cleanText(filters.city, 120));
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRestaurant(slug) {
  const restaurant = await resolveRestaurant(slug);
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', restaurant.id).maybeSingle();
  if (error) throw error;
  return data;
}

// SAVED RESTAURANTS
export async function saveRestaurant(restaurantSlug) {
  const user = await requireUser();
  const restaurant = await resolveRestaurant(restaurantSlug);
  const { data, error } = await supabase
    .from('saved_restaurants')
    .insert({ user_id: user.id, restaurant_id: restaurant.id })
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
}

export async function unsaveRestaurant(restaurantSlug) {
  const user = await requireUser();
  const restaurant = await resolveRestaurant(restaurantSlug);
  const { error } = await supabase
    .from('saved_restaurants')
    .delete()
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;
}

export async function getSavedRestaurants() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('saved_restaurants')
    .select('id,user_id,restaurant_id,created_at,restaurants(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(item => ({
    ...item,
    restaurant_id: item.restaurants?.slug || item.restaurant_id
  }));
}

export async function isRestaurantSaved(userId, restaurantId) {
  const user = await requireUser(userId);
  const restaurant = await resolveRestaurant(restaurantId);
  const { data, error } = await supabase
    .from('saved_restaurants')
    .select('id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

// TEXT REVIEWS
export async function addReview(userId, restaurantId, rating, title, text) {
  const user = await requireUser(userId);
  const restaurant = await resolveRestaurant(restaurantId);
  const numeric = Number(rating);
  const reviewText = cleanText(text, 3000);
  const reviewTitle = cleanText(title, 120);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) throw new Error('Hodnocení musí být 1 až 5');
  if (reviewText.length < 3) throw new Error('Recenze je příliš krátká');
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      restaurant_id: restaurant.id,
      rating: numeric,
      title: reviewTitle || null,
      text: reviewText
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRestaurantReviews(restaurantId) {
  const restaurant = await resolveRestaurant(restaurantId);
  const { data, error } = await supabase
    .from('reviews')
    .select('id,restaurant_id,rating,title,text,created_at,profiles(display_name,avatar_url)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export function subscribeSavedRestaurants(userId, callback) {
  return supabase
    .channel(`saved_restaurants:${String(userId || '')}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'saved_restaurants', filter: `user_id=eq.${String(userId || '')}`
    }, callback)
    .subscribe();
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}

// Fixed legacy migration helper. It never loads the full restaurant catalog and clears only successful local items.
export async function migrateLocalStorageToSupabase() {
  await requireUser();
  let saved;
  try {
    const parsed = JSON.parse(localStorage.getItem('gurmao_saved') || '[]');
    saved = Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    saved = [];
  }
  if (!saved.length) return { migrated: 0, remaining: 0 };

  const remaining = [];
  let migrated = 0;
  for (const slug of saved) {
    try {
      await saveRestaurant(slug);
      migrated += 1;
    } catch (error) {
      console.warn(`Local saved restaurant migration failed: ${slug}`, error);
      remaining.push(slug);
    }
  }
  if (remaining.length) localStorage.setItem('gurmao_saved', JSON.stringify(remaining));
  else localStorage.removeItem('gurmao_saved');
  return { migrated, remaining: remaining.length };
}

// STORAGE
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function uploadRestaurantImage(file, restaurantSlug) {
  const extension = String(file?.name || '').split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const safeSlug = cleanText(restaurantSlug, 160).replace(/[^a-z0-9_-]/gi, '-');
  const path = `${safeSlug}.${extension}`;
  await uploadFile('restaurant-images', path, file);
  return path;
}

export async function uploadAvatar(file) {
  const user = await requireUser();
  const extension = String(file?.name || '').split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const path = `${user.id}/avatar.${extension}`;
  await uploadFile('avatars', path, file);
  await updateUserProfile(user.id, { avatar_path: path });
  return path;
}

export function getRestaurantImageUrl(imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(String(imagePath))) return String(imagePath);
  return getPublicUrl('restaurant-images', imagePath);
}

export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  if (/^https?:\/\//i.test(String(avatarPath))) return String(avatarPath);
  return getPublicUrl('avatars', avatarPath);
}

// CONTACT – compatibility export now uses the protected server function, never direct table INSERT.
export async function submitContactMessage(messageData = {}) {
  const payload = {
    name: messageData.name,
    email: messageData.email,
    subject: messageData.subject,
    message: messageData.message,
    website: messageData.website || '',
    startedAt: Number(messageData.startedAt) || Date.now() - 2000
  };
  const { data, error } = await supabase.functions.invoke('submit-contact', { body: payload });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.message || 'Zprávu se nepodařilo odeslat');
  return data;
}

export async function getContactMessages() {
  await requireUser();
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateContactMessageStatus(messageId, status) {
  await requireUser();
  const allowed = new Set(['new', 'read', 'replied', 'archived']);
  if (!allowed.has(String(status))) throw new Error('Invalid contact status');
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', String(messageId))
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// NUMERIC RATINGS
export async function rateRestaurant(restaurantId, stars) {
  const user = await requireUser();
  const restaurant = await resolveRestaurant(restaurantId);
  const numeric = Number(stars);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) throw new Error('Hodnocení musí být mezi 1 a 5');
  const { data, error } = await supabase
    .from('ratings')
    .upsert({ user_id: user.id, restaurant_id: restaurant.id, stars: numeric }, { onConflict: 'user_id,restaurant_id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserRating(restaurantId) {
  const user = await getCurrentUser();
  if (!user) return null;
  const restaurant = await resolveRestaurant(restaurantId);
  const { data, error } = await supabase
    .from('ratings')
    .select('stars')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id)
    .maybeSingle();
  if (error) throw error;
  return data?.stars ?? null;
}

function emptyRatingStats(restaurantId) {
  return { restaurant_id: restaurantId, rating_count: 0, average_rating: 0, five_stars: 0, four_stars: 0, three_stars: 0, two_stars: 0, one_star: 0 };
}

export async function getRestaurantRatingStats(restaurantId) {
  const restaurant = await resolveRestaurant(restaurantId);
  const { data, error } = await supabase.from('rating_stats').select('*').eq('restaurant_id', restaurant.id).maybeSingle();
  if (!error && data) return data;
  return emptyRatingStats(restaurant.id);
}

export async function getRestaurantRatings(restaurantId) {
  const restaurant = await resolveRestaurant(restaurantId);
  const { data, error } = await supabase
    .from('ratings')
    .select('id,restaurant_id,stars,created_at')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllRatingsStats() {
  const { data, error } = await supabase.from('rating_stats').select('*');
  if (error) {
    console.warn('rating_stats is unavailable:', error.message || error);
    return new Map();
  }
  return new Map((data || []).map(row => [String(row.restaurant_id), row]));
}

export async function getAllUserRatings() {
  const user = await getCurrentUser();
  if (!user) return new Map();
  const { data, error } = await supabase.from('ratings').select('restaurant_id,stars').eq('user_id', user.id);
  if (error) throw error;
  return new Map((data || []).map(row => [String(row.restaurant_id), row.stars]));
}

export async function deleteRating(restaurantId) {
  const user = await requireUser();
  const restaurant = await resolveRestaurant(restaurantId);
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id);
  if (error) throw error;
}

export default supabase;
