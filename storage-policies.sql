-- Supabase Storage Policies Setup
-- GURMAO.cz - Restaurant Images Storage

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Restaurant images: všichni čtou, jen authenticated uploadují
CREATE POLICY "Public can view restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated can upload restaurant images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');

CREATE POLICY "Owner can delete restaurant images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'restaurant-images' AND auth.uid() = owner);

CREATE POLICY "Owner can update restaurant images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'restaurant-images' AND auth.uid() = owner);

-- Chef images: stejné pravidla
CREATE POLICY "Public can view chef images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chef-images');

CREATE POLICY "Authenticated can upload chef images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chef-images' AND auth.role() = 'authenticated');

CREATE POLICY "Owner can delete chef images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chef-images' AND auth.uid() = owner);

CREATE POLICY "Owner can update chef images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'chef-images' AND auth.uid() = owner);

-- Gear images: stejné pravidla
CREATE POLICY "Public can view gear images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gear-images');

CREATE POLICY "Authenticated can upload gear images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gear-images' AND auth.role() = 'authenticated');

CREATE POLICY "Owner can delete gear images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gear-images' AND auth.uid() = owner);

CREATE POLICY "Owner can update gear images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gear-images' AND auth.uid() = owner);

-- Avatars: každý jen svůj (v podsložce s user_id)
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
