CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE support_status AS ENUM ('AVAILABLE', 'OPTIONED', 'UNAVAILABLE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE request_status AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (role IN ('ADMIN', 'EDITOR'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'Libreville',
  description TEXT,
  display_order SMALLINT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  zone_id UUID NOT NULL REFERENCES zones(id),
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  support_type VARCHAR(80) NOT NULL,
  dimensions VARCHAR(60),
  orientation VARCHAR(40),
  is_illuminated BOOLEAN NOT NULL DEFAULT FALSE,
  status support_status NOT NULL DEFAULT 'AVAILABLE',
  indicative_price INTEGER,
  currency CHAR(3) NOT NULL DEFAULT 'XAF',
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id UUID NOT NULL REFERENCES supports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(220) NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE supports ADD COLUMN IF NOT EXISTS source_label TEXT;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS location_precision SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS location_note TEXT;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS data_confidence SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE supports ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS support_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id UUID NOT NULL REFERENCES supports(id) ON DELETE CASCADE,
  code VARCHAR(80) NOT NULL UNIQUE,
  orientation VARCHAR(12) NOT NULL,
  direction TEXT,
  status support_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (support_id, orientation)
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  minimum_faces SMALLINT NOT NULL,
  maximum_faces SMALLINT,
  price_per_face_ht INTEGER NOT NULL,
  price_per_face_ttc INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'XAF',
  includes_printing BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE,
  source_note TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (minimum_faces > 0),
  CHECK (maximum_faces IS NULL OR maximum_faces >= minimum_faces)
);

CREATE TABLE IF NOT EXISTS availability_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id UUID NOT NULL REFERENCES supports(id) ON DELETE CASCADE,
  status support_status NOT NULL,
  starts_on DATE,
  ends_on DATE,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(160),
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(50),
  campaign_start DATE,
  campaign_end DATE,
  message TEXT,
  consent_at TIMESTAMPTZ NOT NULL,
  status request_status NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (campaign_end IS NULL OR campaign_start IS NULL OR campaign_end >= campaign_start)
);

CREATE TABLE IF NOT EXISTS quote_request_supports (
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  support_id UUID NOT NULL REFERENCES supports(id),
  PRIMARY KEY (quote_request_id, support_id)
);

INSERT INTO zones (code, name, city, display_order)
VALUES
  ('ZU1', 'Zone Urbaine 1', 'Libreville', 1),
  ('ZU2', 'Zone Urbaine 2', 'Libreville', 2),
  ('ZU3', 'Zone Urbaine 3', 'Libreville', 3),
  ('ZU4', 'Zone Urbaine 4', 'Libreville', 4),
  ('ZU5', 'Zone Urbaine 5', 'Libreville', 5),
  ('ZA1', 'Zone Aéroportuaire 1', 'Libreville — Aéroport / Okala', 6),
  ('ZA2', 'Zone Aéroportuaire 2', 'Libreville — Aéroport / Okala', 7),
  ('ZA3', 'Zone Aéroportuaire 3', 'Libreville — Voie de contournement', 8)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO supports (reference, name, slug, zone_id, address, latitude, longitude, support_type, dimensions, status, indicative_price, description, is_published)
VALUES
  ('PU-001', 'Ancienne Sobraga', 'ancienne-sobraga', (SELECT id FROM zones WHERE code = 'ZU2'), 'Libreville', 0.4096, 9.4518, 'Panneau 4x3', '12 m²', 'AVAILABLE', 350000, 'Support multipress à forte visibilité sur un axe à trafic soutenu.', TRUE),
  ('PU-002', 'Avenue Jean-Paul II', 'avenue-jean-paul-ii', (SELECT id FROM zones WHERE code = 'ZU2'), 'Libreville', 0.4186, 9.4548, 'Panneau 4x3', '12 m²', 'OPTIONED', 420000, 'Emplacement urbain premium, idéal pour les campagnes de notoriété.', TRUE),
  ('PU-003', 'Bas de Gué-Gué', 'bas-de-gue-gue', (SELECT id FROM zones WHERE code = 'ZU3'), 'Libreville', 0.4004, 9.4623, 'Totem LED', '8 m²', 'AVAILABLE', 600000, 'Format digital à haute fréquence, au cœur des flux urbains.', TRUE),
  ('PU-004', 'Petit Paris', 'petit-paris', (SELECT id FROM zones WHERE code = 'ZU3'), 'Libreville', 0.4055, 9.4711, 'Panneau 8x3', '24 m²', 'AVAILABLE', 550000, 'Grand format visible depuis les principaux parcours de la zone.', TRUE),
  ('PU-005', 'Aéroport — arrivée', 'aeroport-arrivee', (SELECT id FROM zones WHERE code = 'ZA1'), 'Aéroport Léon-Mba, Libreville', 0.4569, 9.4162, 'Panneau 4x3', '12 m²', 'AVAILABLE', NULL, 'Présence stratégique pour atteindre voyageurs et accompagnants.', TRUE),
  ('PU-006', 'Okala — voie rapide', 'okala-voie-rapide', (SELECT id FROM zones WHERE code = 'ZA2'), 'Okala, Libreville', 0.4407, 9.4270, 'Panneau 12x4', '48 m²', 'UNAVAILABLE', NULL, 'Grand format à très forte exposition sur l’axe aéroportuaire.', TRUE)
ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  zone_id = EXCLUDED.zone_id,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  support_type = EXCLUDED.support_type,
  dimensions = EXCLUDED.dimensions,
  status = EXCLUDED.status,
  indicative_price = EXCLUDED.indicative_price,
  description = EXCLUDED.description,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

INSERT INTO support_media (support_id, url, alt_text, display_order, is_cover)
VALUES
  ((SELECT id FROM supports WHERE reference = 'PU-001'), '/media/ancienne-sobraga.jpg', 'Support Ancienne Sobraga à Libreville', 1, TRUE),
  ((SELECT id FROM supports WHERE reference = 'PU-002'), '/media/ancienne-sobraga.jpg', 'Support Avenue Jean-Paul II à Libreville', 1, TRUE),
  ((SELECT id FROM supports WHERE reference = 'PU-003'), '/media/bas-gue-gue.jpg', 'Support Bas de Gué-Gué à Libreville', 1, TRUE),
  ((SELECT id FROM supports WHERE reference = 'PU-004'), '/media/petit-paris.jpg', 'Support Petit Paris à Libreville', 1, TRUE),
  ((SELECT id FROM supports WHERE reference = 'PU-005'), '/media/aeroport-arrivee.jpg', 'Support aéroport arrivée à Libreville', 1, TRUE),
  ((SELECT id FROM supports WHERE reference = 'PU-006'), '/media/okala-voie-rapide.jpg', 'Support Okala voie rapide à Libreville', 1, TRUE)
ON CONFLICT DO NOTHING;
