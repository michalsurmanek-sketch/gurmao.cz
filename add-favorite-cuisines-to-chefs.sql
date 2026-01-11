-- Add favorite_cuisines column to chefs table
-- Run this in Supabase SQL Editor

ALTER TABLE chefs 
ADD COLUMN IF NOT EXISTS favorite_cuisines TEXT;

COMMENT ON COLUMN chefs.favorite_cuisines IS 'Oblíbené typy kuchyně oddělené pomocí " · " (např. "Japonská · Francouzská · Nordic")';
