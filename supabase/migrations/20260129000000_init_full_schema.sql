-- 1. SETUP & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES

-- 3.1 Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  role user_role DEFAULT 'user'::user_role,
  credits_balance int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3.2 System Configs
CREATE TABLE IF NOT EXISTS public.system_configs (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- 3.3 Generations
CREATE TABLE IF NOT EXISTS public.generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  prompt text NOT NULL,
  negative_prompt text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb, 
  status job_status DEFAULT 'QUEUED'::job_status,
  error_message text,
  cost int DEFAULT 0,
  duration_ms int,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_generations_user_created ON public.generations(user_id, created_at DESC);

-- 3.4 Generated Images
CREATE TABLE IF NOT EXISTS public.generated_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id uuid REFERENCES public.generations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  storage_path text NOT NULL,
  seed bigint NOT NULL,
  width int,
  height int,
  created_at timestamptz DEFAULT now()
);

-- 4. HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS recursion)

-- 4.1 Get Role safely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN null; END IF;
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- 4.2 Decrement Credits Safely
CREATE OR REPLACE FUNCTION public.decrement_credits(p_user_id uuid, p_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;

-- 4.3 Handle New User (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, credits_balance)
  VALUES (new.id, new.email, 'user', 10);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. RLS POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles Policies
CREATE POLICY "View Profiles" ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR 
  public.get_my_role() IN ('admin', 'superadmin')
);

CREATE POLICY "Detail Own Profile" ON public.profiles FOR ALL
USING ( auth.uid() = id );

-- 5.2 System Configs Policies
CREATE POLICY "Read Configs" ON public.system_configs FOR SELECT
USING ( true );

CREATE POLICY "Admin Write Configs" ON public.system_configs FOR ALL
USING ( public.get_my_role() IN ('admin', 'superadmin') );

-- 5.3 Generations Policies
CREATE POLICY "View Own Generations" ON public.generations FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Create Own Generations" ON public.generations FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- 5.4 Generated Images Policies
CREATE POLICY "View Own Images" ON public.generated_images FOR SELECT
USING ( auth.uid() = user_id );


-- 6. PERMISSIONS & GRANTS (Fixing 42501 errors)

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO anon;

GRANT ALL ON TABLE public.system_configs TO authenticated;
GRANT ALL ON TABLE public.system_configs TO service_role;
GRANT SELECT ON TABLE public.system_configs TO anon;

GRANT ALL ON TABLE public.generations TO authenticated;
GRANT ALL ON TABLE public.generations TO service_role;

GRANT ALL ON TABLE public.generated_images TO authenticated;
GRANT ALL ON TABLE public.generated_images TO service_role;

GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated; -- triggered by system but good practice
-- Seed System Configurations
INSERT INTO public.system_configs (key, value, description)
VALUES 
    ('feature_flags', '{
        "text_to_image": "enabled",
        "hires_fix": "premium",
        "lora": "premium",
        "refiner": "disabled"
    }'::jsonb, 'Global feature flags for the application'),
    
    ('credit_costs', '{
        "text_to_image": 1,
        "hires_fix": 2,
        "lora": 1,
        "refiner": 1
    }'::jsonb, 'Credit cost per operation');

-- 8. SYNC & SEED PROFILES AUTOMATICALLY
-- This ensures that if you wipe the public schema but keep auth.users, they get restored properly.
INSERT INTO public.profiles (id, email, role, credits_balance)
SELECT 
    id, 
    email, 
    -- Auto-promote emails containing 'admin' or your specific email
    CASE 
      WHEN email ILIKE '%admin%' OR email ILIKE 'teraboom51@gmail.com' THEN 'superadmin'::user_role 
      ELSE 'user'::user_role 
    END,
    CASE 
      WHEN email ILIKE '%admin%' OR email ILIKE 'teraboom51@gmail.com' THEN 9999 
      ELSE 100 
    END
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  role = EXCLUDED.role, -- Enforce the calculated role
  credits_balance = GREATEST(profiles.credits_balance, EXCLUDED.credits_balance); -- Keep higher balance or upgrade


