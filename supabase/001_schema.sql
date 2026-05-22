-- FabricAI Studio — Supabase Schema Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  factory_name TEXT,
  factory_type TEXT DEFAULT 'mechanical' CHECK (factory_type IN ('mechanical', 'electronic', 'jacquard')),
  city TEXT DEFAULT 'Surat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  shaft_count INTEGER DEFAULT 16,
  draft_type TEXT DEFAULT 'straight' CHECK (draft_type IN ('straight', 'pointed', 'skip', 'broken')),
  threading_sequence INTEGER[],
  tie_up_matrix JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designs table
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  design_number TEXT,
  design_name TEXT,
  quality_name TEXT,
  customer_ref TEXT,
  weave_matrix JSONB DEFAULT '[]'::JSONB,
  peg_plan_text TEXT DEFAULT '',
  peg_plan_matrix JSONB DEFAULT '[]'::JSONB,
  lifting_plan_matrix JSONB DEFAULT '[]'::JSONB,
  repeat_w INTEGER DEFAULT 0,
  repeat_h INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yarn specifications table
CREATE TABLE IF NOT EXISTS yarn_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('warp', 'weft_a', 'weft_b', 'weft_c')),
  material TEXT CHECK (material IN ('polyester', 'viscose', 'cotton', 'pv_blend', 'zari')),
  count_system TEXT CHECK (count_system IN ('denier', 'ne')),
  count_value DECIMAL,
  filament_count INTEGER,
  luster TEXT CHECK (luster IN ('bright', 'semi_dull', 'dope_dyed', 'matt')),
  colour_code TEXT,
  group_label TEXT,
  ppi INTEGER,
  cramming BOOLEAN DEFAULT FALSE,
  sequence_pattern TEXT
);

-- Loom specifications table
CREATE TABLE IF NOT EXISTS loom_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
  machine_type TEXT CHECK (machine_type IN ('air_jet', 'rapier', 'water_jet', 'power_loom')),
  dobby_type TEXT CHECK (dobby_type IN ('mechanical', 'staubli', 'grosse', 'picanol', 'other')),
  export_format TEXT CHECK (export_format IN ('.EP', '.JC5', '.DES', '.WEA', 'text')),
  reed_count_stockport INTEGER,
  ends_per_dent INTEGER,
  target_ppi INTEGER,
  machine_rpm INTEGER,
  cloth_width_inches DECIMAL,
  warp_crimp_pct DECIMAL DEFAULT 6,
  weft_crimp_pct DECIMAL DEFAULT 6,
  wastage_pct DECIMAL DEFAULT 3,
  loom_efficiency_pct DECIMAL DEFAULT 85,
  sv1_psi INTEGER,
  sv2_psi INTEGER,
  sv3_psi INTEGER,
  sv4_psi INTEGER,
  sv5_psi INTEGER
);

-- Calculated outputs table
CREATE TABLE IF NOT EXISTS calculated_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID UNIQUE REFERENCES designs(id) ON DELETE CASCADE,
  epi DECIMAL,
  reed_space_inches DECIMAL,
  total_warp_ends INTEGER,
  gsm DECIMAL,
  linear_meter_weight_g DECIMAL,
  oz_per_sq_yard DECIMAL,
  warp_weight_per_100m_g DECIMAL,
  weft_weight_per_100m_g DECIMAL,
  production_m_per_hr DECIMAL,
  warp_consumed_m_per_hr DECIMAL,
  cover_factor DECIMAL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Border designs table
CREATE TABLE IF NOT EXISTS border_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID UNIQUE REFERENCES designs(id) ON DELETE CASCADE,
  border_present BOOLEAN DEFAULT FALSE,
  border_width_cm DECIMAL,
  border_shaft_numbers INTEGER[],
  border_weave_type TEXT CHECK (border_weave_type IN ('plain', 'hopsack', 'custom')),
  border_peg_plan_text TEXT,
  border_peg_plan_matrix JSONB DEFAULT '[]'::JSONB,
  border_weft_group TEXT DEFAULT 'B',
  leno_selvedge BOOLEAN DEFAULT FALSE,
  selvedge_bit_s9 BOOLEAN DEFAULT FALSE,
  selvedge_bit_s10 BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE border_designs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own designs" ON designs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own yarn_specs" ON yarn_specs FOR ALL
  USING (design_id IN (SELECT id FROM designs WHERE user_id = auth.uid()));

CREATE POLICY "Users own loom_specs" ON loom_specs FOR ALL
  USING (design_id IN (SELECT id FROM designs WHERE user_id = auth.uid()));

CREATE POLICY "Users own calculated_outputs" ON calculated_outputs FOR ALL
  USING (design_id IN (SELECT id FROM designs WHERE user_id = auth.uid()));

CREATE POLICY "Users own border_designs" ON border_designs FOR ALL
  USING (design_id IN (SELECT id FROM designs WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_user ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_draft ON designs(draft_id);
CREATE INDEX IF NOT EXISTS idx_yarn_specs_design ON yarn_specs(design_id);
CREATE INDEX IF NOT EXISTS idx_loom_specs_design ON loom_specs(design_id);
