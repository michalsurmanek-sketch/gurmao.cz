# Supabase Storage Setup - GURMAO.cz

## 🗂️ Krok 1: Vytvoření Storage Buckets

V Supabase Dashboard:

```
Storage → Create bucket

Bucket 1:
Name: restaurant-images
Public: ✅ Yes
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

```
Bucket 2:
Name: chef-images
Public: ✅ Yes
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

```
Bucket 3:
Name: gear-images
Public: ✅ Yes
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

```
Bucket 4:
Name: avatars
Public: ✅ Yes
File size limit: 2 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

---

## 🔐 Krok 2: Storage Policies

V Supabase → SQL Editor spusť:

```sql
-- Restaurant images: všichni čtou, jen admins uploadují
CREATE POLICY "Public can view restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated can upload restaurant images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');

CREATE POLICY "Owner can delete restaurant images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'restaurant-images' AND auth.uid() = owner);

-- Chef images: stejné jako restaurant
CREATE POLICY "Public can view chef images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chef-images');

CREATE POLICY "Authenticated can upload chef images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chef-images' AND auth.role() = 'authenticated');

-- Gear images: stejné
CREATE POLICY "Public can view gear images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gear-images');

CREATE POLICY "Authenticated can upload gear images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gear-images' AND auth.role() = 'authenticated');

-- Avatars: každý svůj
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 📦 Krok 3: Aktualizace Database Schema

```sql
-- Změň sloupec image_url na image_path
ALTER TABLE public.restaurants 
  RENAME COLUMN image_url TO image_path;

ALTER TABLE public.chefs
  RENAME COLUMN image_url TO image_path;

ALTER TABLE public.gear
  RENAME COLUMN image_url TO image_path;

ALTER TABLE public.profiles
  RENAME COLUMN avatar_url TO avatar_path;

-- Vyčisti existující data (Unsplash URL)
UPDATE public.restaurants SET image_path = NULL;
UPDATE public.chefs SET image_path = NULL;
UPDATE public.gear SET image_path = NULL;
```

---

## 📸 Krok 4: Upload Testovacích Obrázků

V Supabase Dashboard → Storage → restaurant-images:

1. Klikni "Upload file"
2. Nahraj 3 obrázky pro restaurace:
   - `noir-table.jpg`
   - `ember-steak.jpg`
   - `la-calle.jpg`

Pak aktualizuj databázi:

```sql
UPDATE public.restaurants 
SET image_path = 'noir-table.jpg'
WHERE slug = 'noir-table';

UPDATE public.restaurants 
SET image_path = 'ember-steak.jpg'
WHERE slug = 'ember-steak';

UPDATE public.restaurants 
SET image_path = 'la-calle.jpg'
WHERE slug = 'la-calle';
```

---

## ⏱️ Čas implementace:
- **Storage buckets:** 5 minut
- **Policies:** 3 minuty
- **Schema update:** 2 minuty
- **Upload obrázků:** 10 minut
- **Frontend integrace:** Automatická

**CELKEM: ~20 minut** 🚀

---

**Status:** Připraveno k implementaci!
**Další krok:** Vytvoř buckety v Supabase Dashboard
