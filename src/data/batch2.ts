export const batch2Designs = [
  // SATIN / SATEEN VARIATIONS (51-66)
  {
    "id": "W051", "name": "Satin Weave (5-End)", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 5, "angle": 0, "float_length": "long", "threading": "Skip", "weight": "Light", "weight_range": "130 GSM",
    "tags": ["satin", "lustrous", "smooth"], "popularity": 85,
    "peg_matrix": [[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1]],
    "description": "Lustrous diagonal float. Very smooth hand.", "applications": ["dress fabric", "satin linings"], "characteristics": ["long floats", "lustrous"], "performance_rating": 70, "cost_index": 120, "production_ease": "medium"
  },
  {
    "id": "W052", "name": "Sateen Weave (5-End)", "fabric_type": "Sateen", "weave_type": "Sateen", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 5, "angle": 0, "float_length": "long", "threading": "Skip", "weight": "Light", "weight_range": "130 GSM",
    "tags": ["sateen", "weft-faced", "soft sheen"], "popularity": 80,
    "peg_matrix": [[1,0,0,0,1],[1,1,0,0,0],[0,1,1,0,0],[0,0,1,1,0],[0,0,0,1,1]],
    "description": "Reversed satin with weft floats. Soft sheen.", "applications": ["sateen shirting", "dress linings"], "characteristics": ["weft-faced"], "performance_rating": 70, "cost_index": 120, "production_ease": "medium"
  },
  {
    "id": "W053", "name": "8-End Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 8, "angle": 0, "float_length": "long", "threading": "Skip", "weight": "Light-Medium", "weight_range": "140 GSM",
    "tags": ["satin", "luxury"], "popularity": 90,
    "peg_matrix": [[1,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0],[0,0,0,0,0,0,1,0],[0,1,0,0,0,0,0,0],[0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,1],[0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0]],
    "description": "Extremely lustrous 8-shaft satin.", "applications": ["fine dress satin", "luxury fabrics"], "characteristics": ["ultra-smooth"], "performance_rating": 60, "cost_index": 150, "production_ease": "hard"
  },
  {
    "id": "W054", "name": "10-End Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 10, "repeat_size": 10, "angle": 0, "float_length": "extreme", "threading": "Skip", "weight": "Light-Medium", "weight_range": "145 GSM",
    "tags": ["satin", "premium", "couture"], "popularity": 95,
    "peg_matrix": "10x10_satin_matrix",
    "description": "Premium satin with mirror-like sheen. +9 float.", "applications": ["premium satin", "couture"], "characteristics": ["mirror-like sheen", "ultra-slippery"], "performance_rating": 50, "cost_index": 200, "production_ease": "extreme"
  },
  {
    "id": "W055", "name": "12-End Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 12, "repeat_size": 12, "angle": 0, "float_length": "extreme", "threading": "Skip", "weight": "Medium", "weight_range": "150 GSM",
    "tags": ["satin", "bridal", "extreme luster"], "popularity": 95,
    "peg_matrix": "12x12_satin_matrix",
    "description": "Bridal satin with extreme luster. Float +11.", "applications": ["bridal satin", "haute couture"], "characteristics": ["extreme luster"], "performance_rating": 45, "cost_index": 250, "production_ease": "extreme"
  },
  {
    "id": "W056", "name": "Irregular Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 6, "repeat_size": 6, "angle": 0, "float_length": "variable", "threading": "Skip", "weight": "Light", "weight_range": "135 GSM",
    "tags": ["satin", "textured"], "popularity": 75,
    "peg_matrix": "6x6_irregular_satin",
    "description": "Non-uniform float placement.", "applications": ["casual satin", "textured dress"], "characteristics": ["broken luster"], "performance_rating": 75, "cost_index": 120, "production_ease": "medium"
  },
  {
    "id": "W057", "name": "Satin Stripe", "fabric_type": "Satin Combination", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 8, "angle": 0, "float_length": "variable", "threading": "Mixed", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["satin stripe", "striped"], "popularity": 80,
    "peg_matrix": "8x8_satin_stripe_matrix",
    "description": "Alternating satin + plain stripes.", "applications": ["striped dress", "shirting"], "characteristics": ["lustrous stripes"], "performance_rating": 80, "cost_index": 130, "production_ease": "medium"
  },
  {
    "id": "W058", "name": "Satin Check", "fabric_type": "Satin Combination", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 6, "repeat_size": 12, "angle": 0, "float_length": "variable", "threading": "Variable", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["satin check", "checker"], "popularity": 85,
    "peg_matrix": "12x12_satin_check",
    "description": "Satin + plain in grid pattern.", "applications": ["dress fabric", "decorative"], "characteristics": ["shiny checker squares"], "performance_rating": 80, "cost_index": 140, "production_ease": "hard"
  },
  {
    "id": "W059", "name": "Broken Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 8, "angle": 0, "float_length": "medium", "threading": "Hybrid", "weight": "Medium", "weight_range": "145 GSM",
    "tags": ["satin", "broken"], "popularity": 75,
    "peg_matrix": "8x8_broken_satin",
    "description": "Satin float interrupted by tie-downs.", "applications": ["structured satin", "wrinkle-control"], "characteristics": ["firmer than regular satin"], "performance_rating": 85, "cost_index": 120, "production_ease": "medium"
  },
  {
    "id": "W060", "name": "Combined Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 16, "angle": 0, "float_length": "long", "threading": "Variable", "weight": "Medium", "weight_range": "145 GSM",
    "tags": ["satin", "combined"], "popularity": 80,
    "peg_matrix": "16x16_combined_satin",
    "description": "Multiple satin weaves in zones (5-end + 8-end).", "applications": ["fancy dress satin"], "characteristics": ["mixed luster intensities"], "performance_rating": 70, "cost_index": 150, "production_ease": "hard"
  },
  {
    "id": "W061", "name": "Figured Satin", "fabric_type": "Satin", "weave_type": "Jacquard Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 20, "angle": 0, "float_length": "variable", "threading": "Jacquard", "weight": "Medium", "weight_range": "150 GSM",
    "tags": ["jacquard", "satin", "figured"], "popularity": 90,
    "peg_matrix": "20x20_figured_satin",
    "description": "Satin base with motif interlace changes.", "applications": ["luxury"], "characteristics": ["patterned lustrous areas"], "performance_rating": 80, "cost_index": 200, "production_ease": "hard"
  },
  {
    "id": "W062", "name": "Satin Backed Fabric", "fabric_type": "Double Cloth", "weave_type": "Double Weave", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 10, "repeat_size": 5, "angle": 0, "float_length": "variable", "threading": "Complex", "weight": "Heavy", "weight_range": "200 GSM",
    "tags": ["double cloth", "satin backed"], "popularity": 85,
    "peg_matrix": "5x5_satin_backed_twill",
    "description": "Two-ply with satin face + twill back.", "applications": ["suiting", "quality dress"], "characteristics": ["lustrous front", "structured back"], "performance_rating": 90, "cost_index": 180, "production_ease": "hard"
  },
  {
    "id": "W063", "name": "Double Satin", "fabric_type": "Double Cloth", "weave_type": "Double Weave", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 10, "repeat_size": 5, "angle": 0, "float_length": "long", "threading": "Complex", "weight": "Heavy", "weight_range": "200 GSM",
    "tags": ["double cloth", "double satin", "reversible"], "popularity": 85,
    "peg_matrix": "5x5_double_satin",
    "description": "Two satin layers, interlocked.", "applications": ["reversible satin", "luxury linings"], "characteristics": ["lustrous both sides"], "performance_rating": 85, "cost_index": 200, "production_ease": "hard"
  },
  {
    "id": "W064", "name": "Satin Interlock", "fabric_type": "Satin Combinations", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 6, "repeat_size": 8, "angle": 0, "float_length": "variable", "threading": "Mixed", "weight": "Medium-Heavy", "weight_range": "180 GSM",
    "tags": ["satin", "interlock"], "popularity": 75,
    "peg_matrix": "8x8_satin_interlock",
    "description": "Satin + plain layers, stitched together.", "applications": ["heavy satin dress", "structured"], "characteristics": ["satin surface", "locked base"], "performance_rating": 90, "cost_index": 160, "production_ease": "medium"
  },
  {
    "id": "W065", "name": "Satin Network", "fabric_type": "Satin Combinations", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 10, "angle": 0, "float_length": "variable", "threading": "Skip/Point", "weight": "Light", "weight_range": "135 GSM",
    "tags": ["satin", "network", "web"], "popularity": 70,
    "peg_matrix": "10x10_satin_network",
    "description": "Satin float areas connected by minimal interlace grid.", "applications": ["lightweight satin", "sheer dress"], "characteristics": ["open lustrous pattern", "web-like"], "performance_rating": 65, "cost_index": 140, "production_ease": "medium"
  },
  {
    "id": "W066", "name": "Reversed Satin", "fabric_type": "Satin", "weave_type": "Satin", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 5, "angle": 0, "float_length": "long", "threading": "Skip", "weight": "Light", "weight_range": "130 GSM",
    "tags": ["satin", "reversible"], "popularity": 80,
    "peg_matrix": [[0,0,0,0,1],[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0]],
    "description": "Mirror of standard satin.", "applications": ["reversible fabrics", "satin variants"], "characteristics": ["smooth", "mirror-image"], "performance_rating": 70, "cost_index": 120, "production_ease": "medium"
  },

  // CREPE & DOBBY WEAVES (67-88)
  {
    "id": "W067", "name": "Crepe Weave (Base)", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 4, "angle": 0, "float_length": "short", "threading": "Straight", "weight": "Light", "weight_range": "120 GSM",
    "tags": ["crepe", "crinkled", "matte"], "popularity": 90,
    "peg_matrix": [[1,0,1,0],[0,1,0,1],[1,0,1,0],[0,1,0,1]],
    "description": "Pebbly surface texture.", "applications": ["crepe dress", "casual wear"], "characteristics": ["crinkled", "matte"], "performance_rating": 85, "cost_index": 100, "production_ease": "medium"
  },
  {
    "id": "W068", "name": "Crepe Satin", "fabric_type": "Crepe/Satin", "weave_type": "Mixed", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 5, "repeat_size": 8, "angle": 0, "float_length": "medium", "threading": "Hybrid", "weight": "Light", "weight_range": "130 GSM",
    "tags": ["crepe", "satin", "textured"], "popularity": 85,
    "peg_matrix": "8x8_crepe_satin",
    "description": "Satin areas + crepe zones.", "applications": ["crepe dress with sheen"], "characteristics": ["lustrous + textured surface"], "performance_rating": 80, "cost_index": 125, "production_ease": "medium"
  },
  {
    "id": "W069", "name": "Crepe Twill", "fabric_type": "Crepe/Twill", "weave_type": "Mixed", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 8, "angle": 45, "float_length": "medium", "threading": "Point Variable", "weight": "Light-Medium", "weight_range": "135 GSM",
    "tags": ["crepe", "twill", "textured ribs"], "popularity": 80,
    "peg_matrix": "8x8_crepe_twill",
    "description": "Twill diagonals broken by crepe.", "applications": ["twilled crepe fabric"], "characteristics": ["textured diagonal ribs"], "performance_rating": 85, "cost_index": 115, "production_ease": "medium"
  },
  {
    "id": "W070", "name": "Granular Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 3, "repeat_size": 6, "angle": 0, "float_length": "short", "threading": "Skip/Broken", "weight": "Light", "weight_range": "125 GSM",
    "tags": ["crepe", "granular", "grainy"], "popularity": 75,
    "peg_matrix": "6x6_granular_crepe",
    "description": "Random short floats (1-2 yarns).", "applications": ["fine crepe", "lightweight dress"], "characteristics": ["grainy", "fine crinkle"], "performance_rating": 85, "cost_index": 110, "production_ease": "medium"
  },
  {
    "id": "W071", "name": "Pebble Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 8, "angle": 0, "float_length": "medium", "threading": "Point/Skip", "weight": "Light-Medium", "weight_range": "130 GSM",
    "tags": ["crepe", "pebble"], "popularity": 85,
    "peg_matrix": "8x8_pebble_crepe",
    "description": "Clustered float groups offset by row.", "applications": ["crepe dress", "textured casual"], "characteristics": ["bumpy surface"], "performance_rating": 85, "cost_index": 115, "production_ease": "medium"
  },
  {
    "id": "W072", "name": "Moss Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 4, "angle": 0, "float_length": "short", "threading": "Point", "weight": "Medium", "weight_range": "150 GSM",
    "tags": ["crepe", "moss", "dense"], "popularity": 88,
    "peg_matrix": "4x4_moss_crepe",
    "description": "Very dense interlacing, fine moss-like texture.", "applications": ["structured crepe", "quality dress"], "characteristics": ["dense", "crisp"], "performance_rating": 90, "cost_index": 110, "production_ease": "medium"
  },
  {
    "id": "W073", "name": "Sand Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 3, "repeat_size": 6, "angle": 0, "float_length": "short", "threading": "Mixed", "weight": "Light", "weight_range": "125 GSM",
    "tags": ["crepe", "sand", "grainy"], "popularity": 80,
    "peg_matrix": "6x6_sand_crepe",
    "description": "Mixed short floats creating grainy sand effect.", "applications": ["casual crepe", "textured dress"], "characteristics": ["sandy", "rough texture"], "performance_rating": 85, "cost_index": 110, "production_ease": "medium"
  },
  {
    "id": "W074", "name": "Flat Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 4, "angle": 0, "float_length": "short", "threading": "Straight", "weight": "Light-Medium", "weight_range": "130 GSM",
    "tags": ["crepe", "flat", "smooth"], "popularity": 90,
    "peg_matrix": "4x4_flat_crepe",
    "description": "Minimal texture, flatter surface crepe.", "applications": ["crepe shirting", "smooth dress"], "characteristics": ["smooth crepe", "matte finish"], "performance_rating": 90, "cost_index": 100, "production_ease": "easy"
  },
  {
    "id": "W075", "name": "Irregular Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 8, "angle": 0, "float_length": "variable", "threading": "Random", "weight": "Light-Medium", "weight_range": "130 GSM",
    "tags": ["crepe", "irregular", "fashion"], "popularity": 75,
    "peg_matrix": "8x8_irregular_crepe",
    "description": "Random float placement, entirely unpredictable organic texture.", "applications": ["fashion crepe", "designer dress"], "characteristics": ["organic feel", "unpredictable"], "performance_rating": 80, "cost_index": 120, "production_ease": "medium"
  },
  {
    "id": "W076", "name": "Crepe Stripe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 12, "angle": 0, "float_length": "short", "threading": "Mixed", "weight": "Light-Medium", "weight_range": "130 GSM",
    "tags": ["crepe", "stripe"], "popularity": 80,
    "peg_matrix": "12x8_crepe_stripe",
    "description": "Crepe weave with plain stripes.", "applications": ["striped crepe dress"], "characteristics": ["textured stripes"], "performance_rating": 85, "cost_index": 115, "production_ease": "medium"
  },
  {
    "id": "W077", "name": "Heavy Crepe", "fabric_type": "Crepe", "weave_type": "Crepe", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 4, "angle": 0, "float_length": "short", "threading": "Straight", "weight": "Heavy", "weight_range": "200 GSM",
    "tags": ["crepe", "heavy", "structured"], "popularity": 85,
    "peg_matrix": "4x4_heavy_crepe",
    "description": "Crepe with thicker yarns for winter.", "applications": ["crepe suiting", "winter dress"], "characteristics": ["heavy textured surface"], "performance_rating": 90, "cost_index": 120, "production_ease": "medium"
  },
  {
    "id": "W078", "name": "Dobby Weave (Base)", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 8, "angle": 0, "float_length": "short", "threading": "Dobby", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["dobby", "geometric"], "popularity": 95,
    "peg_matrix": [
      [1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1],
      [1,1,0,0,1,1,0,0],
      [0,0,1,1,0,0,1,1],
      [1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1],
      [1,1,0,0,1,1,0,0],
      [0,0,1,1,0,0,1,1]
    ],
    "description": "Programmable pattern yielding small geometric elements.", "applications": ["shirting", "dress fabric"], "characteristics": ["small geometric pattern"], "performance_rating": 90, "cost_index": 130, "production_ease": "medium"
  },
  {
    "id": "W079", "name": "Geometric Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 12, "angle": 0, "float_length": "medium", "threading": "Dobby", "weight": "Medium", "weight_range": "145 GSM",
    "tags": ["dobby", "geometric"], "popularity": 85,
    "peg_matrix": "12x12_dobby_geometric",
    "description": "Squares and diamonds dobby pattern.", "applications": ["dressy shirting", "home textile"], "characteristics": ["geometric shapes"], "performance_rating": 90, "cost_index": 140, "production_ease": "medium"
  },
  {
    "id": "W080", "name": "Diamond Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 16, "angle": 0, "float_length": "medium", "threading": "Dobby", "weight": "Medium", "weight_range": "150 GSM",
    "tags": ["dobby", "diamond"], "popularity": 88,
    "peg_matrix": "16x16_dobby_diamond",
    "description": "Diamond grid using dobby.", "applications": ["dress fabric", "upholstery"], "characteristics": ["diamond motifs"], "performance_rating": 90, "cost_index": 140, "production_ease": "medium"
  },
  {
    "id": "W081", "name": "Honeycomb Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 8, "angle": 0, "float_length": "medium", "threading": "Dobby", "weight": "Medium", "weight_range": "145 GSM",
    "tags": ["dobby", "honeycomb", "3D"], "popularity": 90,
    "peg_matrix": "8x8_dobby_honeycomb",
    "description": "Honeycomb 3D texture cells.", "applications": ["towel fabric", "textured shirting"], "characteristics": ["3D honeycomb surface"], "performance_rating": 85, "cost_index": 145, "production_ease": "medium"
  },
  {
    "id": "W082", "name": "Birdseye Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 6, "repeat_size": 6, "angle": 0, "float_length": "short", "threading": "Dobby", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["dobby", "birdseye", "dots"], "popularity": 92,
    "peg_matrix": "6x6_dobby_birdseye",
    "description": "Small dot pattern (birds eye effect).", "applications": ["oxford shirting", "dress"], "characteristics": ["tiny circular floats"], "performance_rating": 90, "cost_index": 135, "production_ease": "medium"
  },
  {
    "id": "W083", "name": "Spot Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 6, "repeat_size": 10, "angle": 0, "float_length": "short", "threading": "Dobby", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["dobby", "spot"], "popularity": 85,
    "peg_matrix": "10x10_dobby_spot",
    "description": "Isolated spot motifs scattered.", "applications": ["dress fabric", "casual shirting"], "characteristics": ["small isolated spots"], "performance_rating": 85, "cost_index": 130, "production_ease": "medium"
  },
  {
    "id": "W084", "name": "Stripe Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 16, "angle": 0, "float_length": "medium", "threading": "Dobby", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["dobby", "stripe"], "popularity": 88,
    "peg_matrix": "16x8_dobby_stripe",
    "description": "Pattern repeats inside stripes.", "applications": ["striped shirting"], "characteristics": ["patterned stripes"], "performance_rating": 90, "cost_index": 135, "production_ease": "medium"
  },
  {
    "id": "W085", "name": "Check Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 12, "angle": 0, "float_length": "medium", "threading": "Dobby", "weight": "Medium", "weight_range": "140 GSM",
    "tags": ["dobby", "check"], "popularity": 88,
    "peg_matrix": "12x12_dobby_check",
    "description": "Small check boxes using dobby grid.", "applications": ["check shirting", "dress fabric"], "characteristics": ["small check boxes"], "performance_rating": 90, "cost_index": 135, "production_ease": "medium"
  },
  {
    "id": "W086", "name": "Texture Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 10, "angle": 0, "float_length": "medium", "threading": "Dobby", "weight": "Medium", "weight_range": "150 GSM",
    "tags": ["dobby", "texture", "3D"], "popularity": 85,
    "peg_matrix": "10x10_dobby_texture",
    "description": "Staggered dobby creating a 3D texture.", "applications": ["textured dress", "home textile"], "characteristics": ["textured surface"], "performance_rating": 88, "cost_index": 140, "production_ease": "medium"
  },
  {
    "id": "W087", "name": "Fancy Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 10, "repeat_size": 20, "angle": 0, "float_length": "variable", "threading": "Advanced Dobby", "weight": "Medium", "weight_range": "150 GSM",
    "tags": ["dobby", "fancy", "complex"], "popularity": 80,
    "peg_matrix": "20x20_dobby_fancy",
    "description": "Complex dobby with multiple motif combinations.", "applications": ["premium dress fabric", "home textile"], "characteristics": ["intricate fancy pattern"], "performance_rating": 85, "cost_index": 160, "production_ease": "hard"
  },
  {
    "id": "W088", "name": "Advanced Dobby", "fabric_type": "Dobby", "weave_type": "Dobby", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 10, "repeat_size": 32, "angle": 0, "float_length": "variable", "threading": "Complex", "weight": "Medium", "weight_range": "155 GSM",
    "tags": ["dobby", "advanced", "multi-pattern"], "popularity": 85,
    "peg_matrix": "32x16_dobby_advanced",
    "description": "Zonned multi-patterns integrated via complex block dobby.", "applications": ["designer fabric", "premium dress"], "characteristics": ["multiple patterns integrated"], "performance_rating": 85, "cost_index": 170, "production_ease": "hard"
  },

  // JACQUARD & ADVANCED WEAVES (89-104)
  {
    "id": "W089", "name": "Jacquard Weave (Base)", "fabric_type": "Jacquard", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 24, "angle": 0, "float_length": "variable", "threading": "Straight", "weight": "Medium", "weight_range": "160 GSM",
    "tags": ["jacquard", "complex"], "popularity": 90,
    "peg_matrix": "24x24_jacquard_base",
    "description": "Full individual shaft control for advanced image weaving.", "applications": ["damask", "brocade"], "characteristics": ["custom programmed patterns"], "performance_rating": 85, "cost_index": 200, "production_ease": "hard"
  },
  {
    "id": "W090", "name": "Floral Jacquard", "fabric_type": "Jacquard", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 32, "repeat_size": 32, "angle": 0, "float_length": "variable", "threading": "Straight", "weight": "Medium", "weight_range": "170 GSM",
    "tags": ["jacquard", "floral", "elaborate"], "popularity": 95,
    "peg_matrix": "32x32_jacquard_floral",
    "description": "Elaborate repeating flower patterns.", "applications": ["dress fabrics", "home textile", "sarees"], "characteristics": ["floral motifs"], "performance_rating": 85, "cost_index": 220, "production_ease": "very hard"
  },
  {
    "id": "W091", "name": "Damask (Jacquard)", "fabric_type": "Damask", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 32, "angle": 0, "float_length": "variable", "threading": "Straight", "weight": "Medium-Heavy", "weight_range": "180 GSM",
    "tags": ["jacquard", "damask", "formal"], "popularity": 90,
    "peg_matrix": "32x32_damask",
    "description": "Self-reversing satin/twill motifs.", "applications": ["table linen", "upholstery", "high-end apparel"], "characteristics": ["subtle pattern", "matte on shiny"], "performance_rating": 90, "cost_index": 250, "production_ease": "very hard"
  },
  {
    "id": "W092", "name": "Brocade", "fabric_type": "Brocade", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 40, "angle": 0, "float_length": "variable", "threading": "Jacquard", "weight": "Heavy", "weight_range": "200 GSM",
    "tags": ["jacquard", "brocade", "metallic", "opulent"], "popularity": 95,
    "peg_matrix": "40x40_brocade",
    "description": "Base weave with extra warp featuring metallic/color yarns.", "applications": ["bridal", "ceremonial", "high-fashion"], "characteristics": ["ornate with shimmer", "heavy"], "performance_rating": 85, "cost_index": 300, "production_ease": "extreme"
  },
  {
    "id": "W093", "name": "Tapestry Weave", "fabric_type": "Tapestry", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 48, "angle": 0, "float_length": "variable", "threading": "Jacquard", "weight": "Heavy", "weight_range": "220 GSM",
    "tags": ["jacquard", "tapestry", "decorative"], "popularity": 80,
    "peg_matrix": "48x48_tapestry",
    "description": "Picture-like motifs created via weft-dominant mapping.", "applications": ["upholstery", "wall hanging"], "characteristics": ["painterly image effect"], "performance_rating": 85, "cost_index": 280, "production_ease": "extreme"
  },
  {
    "id": "W094", "name": "Figured Jacquard", "fabric_type": "Jacquard", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 20, "repeat_size": 20, "angle": 0, "float_length": "short", "threading": "Jacquard", "weight": "Medium", "weight_range": "160 GSM",
    "tags": ["jacquard", "figured", "geometric"], "popularity": 85,
    "peg_matrix": "20x20_figured_jacquard",
    "description": "Jacquard featuring small continuous geometric figures.", "applications": ["dress fabric", "shirting"], "characteristics": ["geometric motifs across surface"], "performance_rating": 90, "cost_index": 200, "production_ease": "hard"
  },
  {
    "id": "W095", "name": "Matelassé", "fabric_type": "Matelasse", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 24, "angle": 0, "float_length": "variable", "threading": "Jacquard", "weight": "Medium-Heavy", "weight_range": "180 GSM",
    "tags": ["jacquard", "matelasse", "quilted", "3D"], "popularity": 85,
    "peg_matrix": "24x24_matelasse",
    "description": "Jacquard created padded / puffed effect.", "applications": ["luxury dress", "upholstery"], "characteristics": ["raised padded motifs", "quilted layout"], "performance_rating": 85, "cost_index": 240, "production_ease": "hard"
  },
  {
    "id": "W096", "name": "Double Cloth Jacquard", "fabric_type": "Double Cloth Jacquard", "weave_type": "Double Weave", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 48, "repeat_size": 32, "angle": 0, "float_length": "variable", "threading": "Jacquard Double", "weight": "Very Heavy", "weight_range": "300 GSM",
    "tags": ["jacquard", "double cloth", "reversible"], "popularity": 80,
    "peg_matrix": "32x32_double_jacquard",
    "description": "Two jacquard layers stitched together perfectly.", "applications": ["reversible luxury", "high-end apparel"], "characteristics": ["two-sided jacquard"], "performance_rating": 80, "cost_index": 350, "production_ease": "extreme"
  },
  {
    "id": "W097", "name": "Cut Jacquard", "fabric_type": "Jacquard Pile", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 32, "angle": 0, "float_length": "variable", "threading": "Jacquard", "weight": "Heavy", "weight_range": "200 GSM",
    "tags": ["jacquard", "cut pile", "relief"], "popularity": 85,
    "peg_matrix": "32x32_cut_jacquard",
    "description": "Jacquard pattern featuring cut threads to create pile effects.", "applications": ["luxury dress", "ornate fabric"], "characteristics": ["sculptured relief pattern"], "performance_rating": 80, "cost_index": 280, "production_ease": "extreme"
  },
  {
    "id": "W098", "name": "Lappet Jacquard", "fabric_type": "Jacquard", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 24, "repeat_size": 40, "angle": 0, "float_length": "variable", "threading": "Jacquard + Lappet", "weight": "Medium-Heavy", "weight_range": "180 GSM",
    "tags": ["jacquard", "lappet", "traditional"], "popularity": 80,
    "peg_matrix": "40x40_lappet_jacquard",
    "description": "Base jacquard paired with extra lappet warp figuring.", "applications": ["dress fabric", "Indian traditional"], "characteristics": ["extra warp created pattern"], "performance_rating": 85, "cost_index": 260, "production_ease": "extreme"
  },
  {
    "id": "W099", "name": "Advanced Jacquard", "fabric_type": "Jacquard", "weave_type": "Jacquard", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 32, "repeat_size": 64, "angle": 0, "float_length": "variable", "threading": "Full Jacquard", "weight": "Medium-Heavy", "weight_range": "180 GSM",
    "tags": ["jacquard", "multi-color", "haute couture"], "popularity": 90,
    "peg_matrix": "64x64_advanced_jacquard",
    "description": "Multi-colored extreme complexity spanning large grid layouts.", "applications": ["premium dress", "haute couture"], "characteristics": ["intricate multi-color pattern"], "performance_rating": 80, "cost_index": 400, "production_ease": "extreme"
  },
  
  // PILE WEAVES (100-104)
  {
    "id": "W100", "name": "Pile Weave (Base)", "fabric_type": "Pile Weave", "weave_type": "Pile", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 8, "angle": 0, "float_length": "long", "threading": "Pile Draft", "weight": "Heavy", "weight_range": "280 GSM",
    "tags": ["pile", "terry", "loops"], "popularity": 95,
    "peg_matrix": "8x8_pile_base",
    "description": "Base weave plus extra warp creating uniform loops.", "applications": ["terry cloth", "towel"], "characteristics": ["looped surface", "soft", "absorbent"], "performance_rating": 90, "cost_index": 140, "production_ease": "medium"
  },
  {
    "id": "W101", "name": "Warp Pile (Velvet)", "fabric_type": "Pile Weave", "weave_type": "Velvet", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 4, "angle": 0, "float_length": "long", "threading": "Pile Draft", "weight": "Heavy", "weight_range": "220 GSM",
    "tags": ["pile", "velvet", "warp-pile"], "popularity": 95,
    "peg_matrix": "4x4_warp_pile",
    "description": "Floats over rod are cut, giving ultra plush velvet.", "applications": ["velvet fabric", "luxury apparel"], "characteristics": ["cut velvet pile", "ultra-soft"], "performance_rating": 80, "cost_index": 200, "production_ease": "hard"
  },
  {
    "id": "W102", "name": "Weft Pile (Corduroy)", "fabric_type": "Pile Weave", "weave_type": "Corduroy", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 4, "repeat_size": 4, "angle": 0, "float_length": "medium", "threading": "Twill Base", "weight": "Heavy", "weight_range": "240 GSM",
    "tags": ["pile", "corduroy", "weft-pile"], "popularity": 90,
    "peg_matrix": "4x6_weft_pile",
    "description": "Pile inserted as weft and sliced to generate ribs.", "applications": ["corduroy pants", "casual heavy wear"], "characteristics": ["cut cord ribs", "wale-wise ribs"], "performance_rating": 85, "cost_index": 160, "production_ease": "medium"
  },
  {
    "id": "W103", "name": "Loop Pile (Terry)", "fabric_type": "Pile Weave", "weave_type": "Terry", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 6, "repeat_size": 6, "angle": 0, "float_length": "long", "threading": "Terry Draft", "weight": "Very Heavy", "weight_range": "300 GSM",
    "tags": ["pile", "terry", "loop-pile", "absorbent"], "popularity": 95,
    "peg_matrix": "6x6_loop_pile",
    "description": "Uncut heavily compacted warp loops.", "applications": ["terry towel", "beach wear"], "characteristics": ["looped surface", "raised"], "performance_rating": 90, "cost_index": 150, "production_ease": "medium"
  },
  {
    "id": "W104", "name": "Combination Pile (Cut & Loop)", "fabric_type": "Pile Weave", "weave_type": "Cut & Loop", "twill_ratio": "N/A", "direction": "N/A", "shaft_count": 8, "repeat_size": 8, "angle": 0, "float_length": "variable", "threading": "Mixed Pile", "weight": "Very Heavy", "weight_range": "300 GSM",
    "tags": ["pile", "cut & loop", "textured pile"], "popularity": 85,
    "peg_matrix": "8x8_cut_loop_pile",
    "description": "Slicing and looping combined into an intricate texture.", "applications": ["textured terry", "decorative towel"], "characteristics": ["textured surface", "variable cut"], "performance_rating": 85, "cost_index": 170, "production_ease": "hard"
  }
];
