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

-- Seed a Test User (only if running locally where we might want specific test accounts, 
-- but usually auth.users is handled by the auth service. For Supabase local dev, seed.sql handles this via auth.users)
-- However, we can ensure the profiles exist for any existing users just in case.

-- We can also seed some dummy generations if needed, but configs are the most critical.
