// GURMAO.cz - Supabase Client Configuration
// © 2025 GURMAO.cz

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Vytvoř Supabase projekt na https://supabase.com
 * 2. Zkopíruj Project URL a anon key z Settings → API
 * 3. Nahraď SUPABASE_URL a SUPABASE_ANON_KEY níže
 * 4. Pro produkci: přesuň tyto hodnoty do environment variables
 */

// Supabase credentials
const SUPABASE_URL = 'https://urwsfadrwjgvlinhbcgu.supabase.co';
const SUPABASE_ANON_KEY = 'SUPABASE_CLIENT_API_KEY';

// Import Supabase client (CDN version)
// V produkci můžeš použít npm: npm install @supabase/supabase-js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ======================
// AUTH HELPERS
// ======================

/**
 * Sign up new user
 */
export async function signUp(email, password, displayName = null) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0]
      }
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign in with email/password
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/feed.html'
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  // Clear localStorage
  localStorage.removeItem('gurmao_user');
  window.location.href = 'index.html';
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Check if user is logged in
 */
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Reset password
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });
  
  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
}

// ======================
// PROFILE HELPERS
// ======================

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ======================
// RESTAURANTS HELPERS
// ======================

/**
 * Get all restaurants
 */
export async function getRestaurants(filters = {}) {
  let query = supabase.from('restaurants').select('*');
  
  if (filters.vibe) {
    query = query.eq('vibe', filters.vibe);
  }
  
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Get single restaurant by slug
 */
export async function getRestaurant(slug) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data;
}

// ======================
// SAVED RESTAURANTS (Collections)
// ======================

/**
 * Save restaurant (by slug)
 */
export async function saveRestaurant(restaurantSlug) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  
  // Get restaurant UUID by slug
  const restaurant = await getRestaurant(restaurantSlug);
  if (!restaurant) throw new Error('Restaurant not found');
  
  const { data, error } = await supabase
    .from('saved_restaurants')
    .insert({
      user_id: user.id,
      restaurant_id: restaurant.id
    })
    .select()
    .single();
  
  if (error) {
    // If already saved, ignore duplicate error
    if (error.code === '23505') return null;
    throw error;
  }
  
  return data;
}

/**
 * Unsave restaurant (by slug)
 */
export async function unsaveRestaurant(restaurantSlug) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  
  // Get restaurant UUID by slug
  const restaurant = await getRestaurant(restaurantSlug);
  if (!restaurant) throw new Error('Restaurant not found');
  
  const { error } = await supabase
    .from('saved_restaurants')
    .delete()
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id);
  
  if (error) throw error;
}

/**
 * Get user's saved restaurants
 */
export async function getSavedRestaurants() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('saved_restaurants')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Return with slug as restaurant_id for compatibility
  return data.map(item => ({
    ...item,
    restaurant_id: item.restaurants.slug
  }));
}

/**
 * Check if restaurant is saved
 */
export async function isRestaurantSaved(userId, restaurantId) {
  const { data, error } = await supabase
    .from('saved_restaurants')
    .select('id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .single();
  
  return !error && !!data;
}

// ======================
// REVIEWS HELPERS
// ======================

/**
 * Add review
 */
export async function addReview(userId, restaurantId, rating, title, text) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      restaurant_id: restaurantId,
      rating: rating,
      title: title,
      text: text
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get restaurant reviews
 */
export async function getRestaurantReviews(restaurantId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (display_name, avatar_url)
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// ======================
// REAL-TIME SUBSCRIPTIONS
// ======================

/**
 * Subscribe to saved restaurants changes
 */
export function subscribeSavedRestaurants(userId, callback) {
  return supabase
    .channel('saved_restaurants')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'saved_restaurants',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

// ======================
// AUTH STATE LISTENER
// ======================

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ======================
// MIGRATION HELPER
// ======================

/**
 * Migrate localStorage collections to Supabase
 */
export async function migrateLocalStorageToSupabase(userId) {
  try {
    // Get saved items from localStorage
    const savedKey = 'gurmao_saved';
    const saved = JSON.parse(localStorage.getItem(savedKey) || '[]');
    
    if (!saved || saved.length === 0) {
      console.log('No saved items to migrate');
      return;
    }
    
    // Get all restaurants to map slugs to IDs
    const restaurants = await getRestaurants();
    const restaurantMap = {};
    restaurants.forEach(r => {
      restaurantMap[r.slug] = r.id;
    });
    
    // Insert saved restaurants
    const promises = saved.map(slug => {
      const restaurantId = restaurantMap[slug];
      if (restaurantId) {
        return saveRestaurant(userId, restaurantId);
      }
      return null;
    }).filter(Boolean);
    
    await Promise.all(promises);
    
    console.log(`✅ Migrated ${promises.length} saved restaurants`);
    
    // Clear localStorage
    localStorage.removeItem(savedKey);
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// ======================
// STORAGE HELPERS
// ======================

/**
 * Upload file to storage
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data;
}

/**
 * Get public URL for file
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
}

/**
 * Upload restaurant image
 */
export async function uploadRestaurantImage(file, restaurantSlug) {
  const ext = file.name.split('.').pop();
  const path = `${restaurantSlug}.${ext}`;
  
  await uploadFile('restaurant-images', path, file);
  return path;
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  
  const ext = file.name.split('.').pop();
  const path = `${user.id}/avatar.${ext}`;
  
  await uploadFile('avatars', path, file);
  
  // Update profile with avatar path
  await updateUserProfile(user.id, { avatar_path: path });
  
  return path;
}

/**
 * Get restaurant image URL
 */
export function getRestaurantImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Fallback for old URLs
  return getPublicUrl('restaurant-images', imagePath);
}

/**
 * Get avatar URL
 */
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath; // Fallback for old URLs
  return getPublicUrl('avatars', avatarPath);
}

// Export client as default
export default supabase;
