-- SQL to add premium status fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Initialize existing profiles to have non-premium status
UPDATE profiles
SET is_premium = FALSE
WHERE is_premium IS NULL;
