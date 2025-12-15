# Supabase Setup Guide - GURMAO.cz

## 🚀 Quick Start - Supabase Integration

### Krok 1: Vytvoření Supabase projektu (10 minut)

1. **Registrace:**
   ```
   https://supabase.com/
   → Sign up (GitHub účet doporučen)
   ```

2. **Nový projekt:**
   ```
   → New Project
   Name: gurmao-cz
   Database Password: [silné heslo - ulož si ho!]
   Region: Europe (Frankfurt nebo Amsterdam)
   → Create project
   ```

3. **Počkej na setup:** ~2 minuty

4. **Zkopíruj credentials:**
   ```
   Settings → API
   
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   ```

---

## 📦 Krok 2: Database Schema

V Supabase → SQL Editor → New query:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (auto-created by Supabase Auth)
-- Rozšíříme o custom fields

-- User profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants (katalog)
CREATE TABLE public.restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  vibe TEXT NOT NULL,
  tag TEXT,
  description TEXT,
  image_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  save_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved restaurants (sbírky)
CREATE TABLE public.saved_restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  text TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- Chefs (kuchaři)
CREATE TABLE public.chefs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  restaurant_id UUID REFERENCES public.restaurants(id),
  image_url TEXT,
  vibe TEXT,
  signature_style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gear/Products
CREATE TABLE public.gear (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  used_by_count INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections (custom sbírky)
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection items
CREATE TABLE public.collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, restaurant_id)
);

-- Indexes pro performance
CREATE INDEX idx_saved_restaurants_user_id ON public.saved_restaurants(user_id);
CREATE INDEX idx_saved_restaurants_restaurant_id ON public.saved_restaurants(restaurant_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_restaurant_id ON public.reviews(restaurant_id);
CREATE INDEX idx_restaurants_vibe ON public.restaurants(vibe);
CREATE INDEX idx_restaurants_city ON public.restaurants(city);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: každý vidí všechny, ale editovat jen svůj
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Saved restaurants: vidí jen vlastník
CREATE POLICY "Users can view own saved restaurants"
  ON public.saved_restaurants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved restaurants"
  ON public.saved_restaurants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved restaurants"
  ON public.saved_restaurants FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews: všichni vidí, jen vlastník edituje
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Collections: public viditelné všem, private jen vlastníkovi
CREATE POLICY "Public collections are viewable by everyone"
  ON public.collections FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- Restaurants: všichni čtou
CREATE POLICY "Restaurants are viewable by everyone"
  ON public.restaurants FOR SELECT
  USING (true);

-- Trigger pro auto-vytvoření profilu po registraci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pro update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert mock data
INSERT INTO public.restaurants (slug, name, city, vibe, tag, description, image_url) VALUES
  ('noir-table', 'Noir Table', 'Praha', '🍷 LUXE', 'fine dining', 'Místo, kde se čas zpomalí. Oheň, ticho, precizní servis.', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80'),
  ('ember-steak', 'Ember Steak', 'Brno', '🔥 DRAMA', 'steakhouse', 'Oheň, kouř, maso. Žádné výmluvy.', 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80'),
  ('la-calle', 'La Calle', 'Ostrava', '🌮 CHAOS', 'street food', 'Chaos s chuťovým smyslem.', 'https://images.unsplash.com/photo-1529692236671-f1dc2c0f2c0e?auto=format&fit=crop&w=1200&q=80');
```

---

## 🔧 Krok 3: Enable Authentication Providers

V Supabase Dashboard:

```
Authentication → Providers

✅ Email (enabled by default)

Google OAuth:
→ Enable Google provider
→ Redirect URL: https://xxxxx.supabase.co/auth/v1/callback
→ Přidej do Google Cloud Console
```

### Google OAuth Setup:
```
1. https://console.cloud.google.com/
2. Create Project: "GURMAO"
3. APIs & Services → Credentials
4. Create OAuth Client ID
   - Application type: Web application
   - Authorized redirect URIs: 
     https://xxxxx.supabase.co/auth/v1/callback
5. Copy Client ID & Secret
6. Vlož do Supabase → Authentication → Providers → Google
```

---

## 💾 Krok 4: Email Templates

Authentication → Email Templates

**Confirm signup:**
```html
<h2>Vítej v GURMAO! 🍷</h2>
<p>Klikni pro potvrzení emailu:</p>
<p><a href="{{ .ConfirmationURL }}">Potvrdit email</a></p>
<p><strong>Nejez. Prožij.</strong></p>
```

**Reset password:**
```html
<h2>Reset hesla - GURMAO</h2>
<p>Požádal jsi o reset hesla.</p>
<p><a href="{{ .ConfirmationURL }}">Reset hesla</a></p>
<p>Pokud jsi to nebyl ty, ignoruj tento email.</p>
```

---

## ⏱️ Čas implementace:
- **Setup Supabase:** 10 minut
- **Database schema:** 5 minut (copy-paste SQL)
- **Auth providers:** 5 minut
- **Frontend integrace:** Následující krok

**CELKEM: ~20 minut** 🚀

---

**Status:** Schema připraveno pro produkci!
**Další krok:** Integrace do frontendu (login.html, app.js)
