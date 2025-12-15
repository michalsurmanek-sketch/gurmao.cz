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

// TODO: Nahraď těmito hodnotami z Supabase dashboardu
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

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
 * Save restaurant
 */
export async function saveRestaurant(userId, restaurantId, notes = null) {
  const { data, error } = await supabase
    .from('saved_restaurants')
    .insert({
      user_id: userId,
      restaurant_id: restaurantId,
      notes: notes
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Increment save_count
  await supabase.rpc('increment_save_count', { restaurant_id: restaurantId });
  
  return data;
}

/**
 * Unsave restaurant
 */
export async function unsaveRestaurant(userId, restaurantId) {
  const { error } = await supabase
    .from('saved_restaurants')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);
  
  if (error) throw error;
  
  // Decrement save_count
  await supabase.rpc('decrement_save_count', { restaurant_id: restaurantId });
}

/**
 * Get user's saved restaurants
 */
export async function getSavedRestaurants(userId) {
  const { data, error } = await supabase
    .from('saved_restaurants')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
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

// Export client as default
export default supabase;
