-- Add missing columns to chefs table
-- Run this in Supabase SQL Editor

-- Add role column (e.g. "Head Chef", "Sous Chef", "Pastry Chef")
ALTER TABLE chefs 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Add description column (longer text description)
ALTER TABLE chefs 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add specialty column (single specialty)
ALTER TABLE chefs 
ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Add specialties column (multiple specialties separated by " · ")
ALTER TABLE chefs 
ADD COLUMN IF NOT EXISTS specialties TEXT;

-- Add comments
COMMENT ON COLUMN chefs.role IS 'Pozice kuchaře (např. "Head Chef", "Sous Chef")';
COMMENT ON COLUMN chefs.description IS 'Delší popis kuchaře a jeho stylu';
COMMENT ON COLUMN chefs.specialty IS 'Hlavní specialita kuchaře';
COMMENT ON COLUMN chefs.specialties IS 'Více specialit oddělených pomocí " · "';
