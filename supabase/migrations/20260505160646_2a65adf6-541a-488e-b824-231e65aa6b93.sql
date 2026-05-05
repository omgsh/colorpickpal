
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id text NOT NULL,
  license_key text NOT NULL UNIQUE,
  stripe_session_id text UNIQUE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_licenses_install_id ON public.licenses(install_id);
CREATE INDEX idx_licenses_license_key ON public.licenses(license_key);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- No policies: only edge functions using the service role can access.
