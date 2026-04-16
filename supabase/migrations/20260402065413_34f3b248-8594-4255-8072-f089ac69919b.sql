
-- Add referral columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Generate referral codes for existing users
UPDATE public.profiles
SET referral_code = LOWER(SUBSTR(MD5(user_id::text || now()::text), 1, 8))
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL with a default for new rows
ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET DEFAULT LOWER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8));

-- Create referral_bonuses table
CREATE TABLE public.referral_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  deposit_id UUID REFERENCES public.transactions(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own referral bonuses (as referrer)
CREATE POLICY "Users can view own referral bonuses"
  ON public.referral_bonuses FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

-- RLS: Admins can view all referral bonuses
CREATE POLICY "Admins can view all referral bonuses"
  ON public.referral_bonuses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can update referral bonuses
CREATE POLICY "Admins can update referral bonuses"
  ON public.referral_bonuses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: System/authenticated can insert referral bonuses
CREATE POLICY "Authenticated can insert referral bonuses"
  ON public.referral_bonuses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for referral_bonuses
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_bonuses;
