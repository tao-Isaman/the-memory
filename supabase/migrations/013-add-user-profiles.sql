-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  birthday DATE,
  gender TEXT,
  job TEXT,
  relationship_status TEXT,
  occasion_type TEXT,
  profile_credits_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Add constraints
ALTER TABLE public.user_profiles
  ADD CONSTRAINT valid_gender CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));

ALTER TABLE public.user_profiles
  ADD CONSTRAINT valid_relationship_status CHECK (relationship_status IS NULL OR relationship_status IN ('single', 'dating', 'married', 'other'));

ALTER TABLE public.user_profiles
  ADD CONSTRAINT valid_occasion_type CHECK (occasion_type IS NULL OR occasion_type IN ('valentine', 'anniversary', 'birthday', 'other'));

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);
