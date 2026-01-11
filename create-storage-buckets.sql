-- Create Supabase Storage buckets for image uploads
-- Run this in Supabase SQL Editor

-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create public bucket for restaurant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create public bucket for chef images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chef-images', 'chef-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create public bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create public bucket for gear images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gear-images', 'gear-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow uploads for authenticated users

-- Restaurant images policy
CREATE POLICY "Allow authenticated users to upload restaurant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Allow public read access to restaurant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');

-- Chef images policy
CREATE POLICY "Allow authenticated users to upload chef images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chef-images');

CREATE POLICY "Allow public read access to chef images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chef-images');

-- Post images policy
CREATE POLICY "Allow authenticated users to upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Allow public read access to post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Gear images policy
CREATE POLICY "Allow authenticated users to upload gear images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gear-images');

CREATE POLICY "Allow public read access to gear images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gear-images');
