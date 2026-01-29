-- Add 'is_premium' column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Add 'history' to system_configs default if not present
-- Note: complex to edit JSONB in place safely in SQL without knowing current state, 
-- but application logic handles defaults. We just ensure the column exists.

-- Update policies to consider 'is_premium' if needed, though most logic is in app layer 
-- or we can expose 'is_premium' to the user view policy.

-- Refresh the 'View Profiles' policy to ensure is_premium is visible to owner/admin
-- (Already select * so it should pick up new column)

-- Grant access to new column implicitly covered by table grant
