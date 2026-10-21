/**
 * BREEAM UK Construction Project Scoring Engine
 * Temporary Works Consulting & Design Ltd (temporaryworksconsulting.com)
 *
 * Implements BREEAM UK New Construction (NC), Refurbishment & Fit-Out (RFO),
 * and Infrastructure / Civil Works credit weighting, minimum standards gates,
 * site calculator helpers (Man 03, Wst 01, Mat 03), and gap-to-target optimizer.
 */

export const RATING_BANDS = [
  { id: 'outstanding', label: 'Outstanding', minScore: 85, stars: '★★★★★', color: '#2A9B96' },
  { id: 'excellent', label: 'Excellent', minScore: 70, stars: '★★★★☆', color: '#199d5c' },
  { id: 'very_good', label: 'Very Good', minScore: 55, stars: '★★★☆☆', color: '#C6A15B' },
  { id: 'good', label: 'Good', minScore: 45, stars: '★★☆☆☆', color: '#d48b28' },
  { id: 'pass', label: 'Pass', minScore: 30, stars: '★☆☆☆☆', color: '#7a8694' },
  { id: 'unclassified', label: 'Unclassified', minScore: 0, stars: '☆☆☆☆☆', color: '#B12D27' }
];

export const RATING_ORDER = ['unclassified', 'pass', 'good', 'very_good', 'excellent', 'outstanding'];

export const SCHEMES = {
  'nc-fully-fitted': {
    id: 'nc-fully-fitted',
    name: 'BREEAM UK New Construction — Fully Fitted',
    shortName: 'UK NC (Fully Fitted)',
    description: 'Standard BREEAM UK New Construction weighting for non-domestic buildings with full services and fit-out.',
    weights: {
      Man: 11.0,
      Hea: 14.0,
      Ene: 16.0,
      Tra: 10.0,
      Wat: 7.0,
      Mat: 15.0,
      Wst: 6.0,
      LE: 13.0,
      Pol: 8.0,
      Inn: 10.0
    }
  },
  'nc-shell-core': {
    id: 'nc-shell-core',
    name: 'BREEAM UK New Construction — Shell & Core',
    shortName: 'UK NC (Shell & Core)',
    description: 'Adjusted BREEAM UK New Construction weightings for speculative developer shell and core works.',
    weights: {
      Man: 12.0,
      Hea: 10.0,
      Ene: 15.0,
      Tra: 11.5,
      Wat: 7.5,
      Mat: 17.5,
      Wst: 7.0,
      LE: 12.5,
      Pol: 7.0,
      Inn: 10.0
    }
  },
  'nc-shell-only': {
    id: 'nc-shell-only',
    name: 'BREEAM UK New Construction — Shell Only',
    shortName: 'UK NC (Shell Only)',
    description: 'BREEAM UK New Construction weightings where core HVAC and internal fit-out are excluded from the main contract.',
    weights: {
      Man: 12.5,
      Hea: 8.0,
      Ene: 9.5,
      Tra: 14.5,
      Wat: 2.0,
      Mat: 22.0,
      Wst: 8.0,
      LE: 16.5,
      Pol: 7.0,
      Inn: 10.0
    }
  },
  'rfo-full': {
    id: 'rfo-full',
    name: 'BREEAM UK Refurbishment & Fit-Out (Parts 1–4)',
    shortName: 'UK RFO (Full Refurb)',
    description: 'BREEAM UK Refurbishment and Fit-Out across fabric, structure, core services and interior fit-out.',
    weights: {
      Man: 12.0,
      Hea: 15.0,
      Ene: 16.0,
      Tra: 9.0,
      Wat: 7.5,
      Mat: 14.5,
      Wst: 7.5,
      LE: 9.5,
      Pol: 9.0,
      Inn: 10.0
    }
  },
  'infra-civil': {
    id: 'infra-civil',
    name: 'Civil & Heavy Temporary Works / Enabling Package',
    shortName: 'Civil & Enabling Focus',
    description: 'Weighted profile for infrastructure, substructures, piling platforms, earthworks and enabling packages.',
    weights: {
      Man: 14.0,
      Hea: 7.0,
      Ene: 11.0,
      Tra: 10.0,
      Wat: 6.0,
      Mat: 19.0,
      Wst: 11.0,
      LE: 14.0,
      Pol: 8.0,
      Inn: 10.0
    }
  }
};

export const CATEGORIES = [
  {
    id: 'Man',
    code: 'MAN',
    name: 'Management',
    summary: 'Project brief, life cycle costing, responsible construction practices (Man 03), commissioning and aftercare.',
    siteNote: 'Principal Contractor holds primary responsibility for Man 03 (CCS, site energy/water/transport monitoring, and utility logging).'
  },
  {
    id: 'Hea',
    code: 'HEA',
    name: 'Health & Wellbeing',
    summary: 'Visual comfort, indoor air quality (Hea 02), thermal comfort, acoustic performance, water quality and safe access.',
    siteNote: 'Site team controls indoor air quality plan, low-VOC material compliance and protection of ductwork during construction.'
  },
  {
    id: 'Ene',
    code: 'ENE',
    name: 'Energy',
    summary: 'Reduction of energy use and carbon emissions (Ene 01), sub-metering (Ene 02), external lighting and low-carbon design.',
    siteNote: 'Sub-metering commissioning, air-tightness testing and avoiding thermal bridging on temporary-to-permanent penetrations.'
  },
  {
    id: 'Tra',
    code: 'TRA',
    name: 'Transport',
    summary: 'Public transport accessibility, proximity to amenities, alternative transport modes and travel plan (Tra 01 / Tra 02).',
    siteNote: 'Protecting cycle storage footprints and electric vehicle charging infrastructure ducts during groundworks.'
  },
  {
    id: 'Wat',
    code: 'WAT',
    name: 'Water',
    summary: 'Water consumption (Wat 01), water monitoring (Wat 02), leak detection (Wat 03) and water-efficient equipment.',
    siteNote: 'Installing pulsed main water meters, sanitary supply shut-off valves and verifying sanitaryware flow rates.'
  },
  {
    id: 'Mat',
    code: 'MAT',
    name: 'Materials',
    summary: 'Life-cycle impacts (Mat 01), EPD specification, responsible sourcing of construction products (Mat 03) and durability (Mat 05).',
    siteNote: 'CRITICAL FOR TEMPORARY WORKS: 100% of site timber (formwork, hoardings, sole plates, propping wedges) must be legal and FSC/PEFC Chain-of-Custody certified.'
  },
  {
    id: 'Wst',
    code: 'WST',
    name: 'Waste',
    summary: 'Construction waste management (Wst 01), recycled aggregates (Wst 02), operational waste (Wst 03) and adaptation to climate change.',
    siteNote: 'CRITICAL FOR TEMPORARY WORKS: Crushed concrete/granular working platforms & piling mats (BR 470) directly contribute to Wst 01 diversion & Wst 02 recycled aggregate credits.'
  },
  {
    id: 'LE',
    code: 'LE',
    name: 'Land Use & Ecology',
    summary: 'Site selection (LE 01), ecological value protection (LE 02/03), enhancing site ecology (LE 04) and long-term biodiversity (LE 05).',
    siteNote: 'Tree root protection zones (BS 5837), hoarding lines, crane outrigger exclusion zones and Suitably Qualified Ecologist (SQE) timing.'
  },
  {
    id: 'Pol',
    code: 'POL',
    name: 'Pollution',
    summary: 'Impact of refrigerants, NOx emissions, surface water run-off & flood risk (Pol 03), night-time light and noise attenuation.',
    siteNote: 'Silt traps, settlement tanks for excavation dewatering, concrete washout containment and acoustic enclosures on plant.'
  },
  {
    id: 'Inn',
    code: 'INN',
    name: 'Innovation (Exemplary)',
    summary: 'Exemplary level performance in standard BREEAM issues (Man 03, Wst 01, Ene 01, Mat 01/03) or approved innovations (+1% each, max 10%).',
    siteNote: 'Exemplary CCS score (≥40/45 or ≥42/50) and exemplary non-hazardous construction waste reduction & diversion (>85% weight / >75% volume).'
  }
];

/**
 * Full BREEAM UK Credit Catalogue across all 10 categories.
 * Includes owner ('contractor' | 'design' | 'client'), difficulty (1=easy, 2=moderate, 3=hard),
 * RIBA stage gate, temporary works connection, and minimum standard rules.
 */
export const BREEAM_ISSUES = [
  // MANAGEMENT
  {
    id: 'Man 01',
    category: 'Man',
    title: 'Project brief and design',
    maxCredits: 4,
    defaultTargeted: 3,
    owner: 'client',
    difficulty: 1,
    stageGate: 'RIBA Stage 2',
    evidenceRequired: 'Project delivery stakeholder consultation records, BREEAM AP appointment letter & Stage 2 report.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Man 02',
    category: 'Man',
    title: 'Life cycle cost and service life planning',
    maxCredits: 4,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 2 / Stage 4',
    evidenceRequired: 'Elemental Life Cycle Cost (LCC) plan at Stage 2 and component-level LCC options appraisal at Stage 4.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Man 03',
    category: 'Man',
    title: 'Responsible construction practices',
    maxCredits: 6,
    defaultTargeted: 5,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 5 (Construction)',
    prerequisiteLabel: 'All site timber used in temporary works & permanent works must be legally harvested and traded (UKTR).',
    evidenceRequired: 'EMS certificate (ISO 14001), BREEAM Responsibility matrix, CCS audit score reports, monthly site energy/water/transport logs.',
    twLink: true,
    twNote: 'Covers site hoarding appearance, legal timber for falsework/formwork, and fuel/transport logs for heavy plant, piling rigs & muck-away.',
    minStandards: {
      excellent: { minCredits: 1, note: 'At least 1 credit (Considerate Construction / CCS compliance) required for Excellent.' },
      outstanding: { minCredits: 2, note: 'At least 2 credits (High CCS performance) required for Outstanding.' }
    }
  },
  {
    id: 'Man 04',
    category: 'Man',
    title: 'Commissioning and handover',
    maxCredits: 4,
    defaultTargeted: 3,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 5–6',
    evidenceRequired: 'Commissioning schedule, thermographic survey report, air-tightness test results, and Building User Guide (BUG).',
    twLink: false,
    minStandards: {
      very_good: { minCredits: 1, note: 'Commissioning schedule & Building User Guide required for Very Good and above.' },
      excellent: { minCredits: 1, note: 'Commissioning schedule & Building User Guide required for Excellent.' },
      outstanding: { minCredits: 1, note: 'Commissioning schedule & Building User Guide required for Outstanding.' }
    }
  },
  {
    id: 'Man 05',
    category: 'Man',
    title: 'Aftercare',
    maxCredits: 3,
    defaultTargeted: 2,
    owner: 'client',
    difficulty: 2,
    stageGate: 'RIBA Stage 6–7',
    evidenceRequired: 'Seasonal commissioning commitment, 12-month aftercare support contract, Post-Occupancy Evaluation (POE) commitment.',
    twLink: false,
    minStandards: {
      excellent: { minCredits: 1, note: 'At least 1 credit (Seasonal commissioning) required for Excellent.' },
      outstanding: { minCredits: 1, note: 'At least 1 credit (Seasonal commissioning) required for Outstanding.' }
    }
  },

  // HEALTH & WELLBEING
  {
    id: 'Hea 01',
    category: 'Hea',
    title: 'Visual comfort',
    maxCredits: 6,
    defaultTargeted: 3,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 4',
    prerequisiteLabel: 'Zero-flicker high-frequency LED ballasts / drivers across all occupied spaces.',
    evidenceRequired: 'Glare control strategy, daylighting illuminance modelling, view-out floorplans, and internal/external lighting specs.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Hea 02',
    category: 'Hea',
    title: 'Indoor air quality',
    maxCredits: 5,
    defaultTargeted: 3,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'Indoor Air Quality Plan (IAQP), VOC/formaldehyde product data sheets & testing, ventilation intake/exhaust separation.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Hea 04',
    category: 'Hea',
    title: 'Thermal comfort',
    maxCredits: 3,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Dynamic thermal modelling to CIBSE TM52 / TM59 under current and projected climate change scenarios, zoning controls.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Hea 05',
    category: 'Hea',
    title: 'Acoustic performance',
    maxCredits: 4,
    defaultTargeted: 2,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'Suitably Qualified Acoustician (SQA) design review and pre-completion acoustic testing (sound insulation, indoor ambient noise, reverberation).',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Hea 06',
    category: 'Hea',
    title: 'Safety and security',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 2–4',
    evidenceRequired: 'Safe cycle/pedestrian access separation audit and Security Needs Assessment (SNA) by a Suitably Qualified Security Specialist.',
    twLink: true,
    twNote: 'Temporary traffic management, pedestrian segregation gantries and hoarding sightlines at site entrances must maintain safe separation.',
    minStandards: {}
  },
  {
    id: 'Hea 07',
    category: 'Hea',
    title: 'Safe and healthy surroundings',
    maxCredits: 2,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Dedicated outdoor amenity space drawings and compliant potable water provision.',
    twLink: false,
    minStandards: {}
  },

  // ENERGY
  {
    id: 'Ene 01',
    category: 'Ene',
    title: 'Reduction of energy use and carbon emissions',
    maxCredits: 13,
    defaultTargeted: 7,
    owner: 'design',
    difficulty: 3,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'BRUKL / SBEM / DSM Part L output, BREEAM Energy Performance Ratio (EPR_NC) calculation and as-built EPC.',
    twLink: true,
    twNote: 'Temporary propping penetrations through the building envelope and tower crane tie openings must be sealed and thermally detailed to pass air-permeability targets.',
    minStandards: {
      excellent: { minCredits: 4, note: 'Minimum 4 credits in Ene 01 required for Excellent rating.' },
      outstanding: { minCredits: 6, note: 'Minimum 6 credits in Ene 01 required for Outstanding rating.' }
    }
  },
  {
    id: 'Ene 02',
    category: 'Ene',
    title: 'Energy monitoring',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'Sub-metering schematics covering ≥90% of estimated annual energy consumption by end-use and BMS integration.',
    twLink: false,
    minStandards: {
      very_good: { minCredits: 1, note: 'At least 1 credit (First sub-metering credit) required for Very Good and above.' },
      excellent: { minCredits: 1, note: 'At least 1 credit (First sub-metering credit) required for Excellent.' },
      outstanding: { minCredits: 1, note: 'At least 1 credit (First sub-metering credit) required for Outstanding.' }
    }
  },
  {
    id: 'Ene 03',
    category: 'Ene',
    title: 'External lighting',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'External luminaire schedule (≥70 lm/W luminous efficacy) with daylight sensors and time-switch controls.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Ene 04',
    category: 'Ene',
    title: 'Low carbon design',
    maxCredits: 3,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 2',
    evidenceRequired: 'Passive design analysis report (Stage 2) and Low and Zero Carbon (LZC) technologies feasibility study.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Ene 06',
    category: 'Ene',
    title: 'Energy efficient transportation systems',
    maxCredits: 3,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Lift traffic analysis and VVVF regenerative drive / standby mode specification.',
    twLink: false,
    minStandards: {}
  },

  // TRANSPORT
  {
    id: 'Tra 01',
    category: 'Tra',
    title: 'Transport assessment and travel plan',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'client',
    difficulty: 1,
    stageGate: 'RIBA Stage 2',
    evidenceRequired: 'Site-specific Transport Assessment and Travel Plan developed no later than Concept Design (Stage 2).',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Tra 02',
    category: 'Tra',
    title: 'Sustainable transport measures',
    maxCredits: 10,
    defaultTargeted: 6,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 3–4',
    evidenceRequired: 'Accessibility Index (AI) calculation, compliant cycle storage, showers/lockers, and EV charging points.',
    twLink: false,
    minStandards: {}
  },

  // WATER
  {
    id: 'Wat 01',
    category: 'Wat',
    title: 'Water consumption',
    maxCredits: 5,
    defaultTargeted: 3,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'BREEAM Wat 01 calculator tool output, sanitaryware manufacturer data sheets and as-installed photographic evidence.',
    twLink: false,
    minStandards: {
      good: { minCredits: 1, note: 'Minimum 1 credit (12.5% potable water reduction) required for Good and above.' },
      very_good: { minCredits: 1, note: 'Minimum 1 credit (12.5% potable water reduction) required for Very Good.' },
      excellent: { minCredits: 1, note: 'Minimum 1 credit (12.5% potable water reduction) required for Excellent.' },
      outstanding: { minCredits: 2, note: 'Minimum 2 credits (25% potable water reduction) required for Outstanding.' }
    }
  },
  {
    id: 'Wat 02',
    category: 'Wat',
    title: 'Water monitoring',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'Pulsed water meter specification on main supply and sub-meters for plant areas consuming ≥10% of total water demand.',
    twLink: false,
    minStandards: {
      very_good: { minCredits: 1, note: 'Main pulsed water meter credit required for Very Good and above.' },
      excellent: { minCredits: 1, note: 'Main pulsed water meter credit required for Excellent.' },
      outstanding: { minCredits: 1, note: 'Main pulsed water meter credit required for Outstanding.' }
    }
  },
  {
    id: 'Wat 03',
    category: 'Wat',
    title: 'Water leak detection and prevention',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'Major leak detection system spanning utility boundary to building manifold, plus WC area occupancy flow shut-off.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Wat 04',
    category: 'Wat',
    title: 'Water efficient equipment',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Irrigation / vehicle wash / process water efficiency schedule or drought-tolerant planting specification.',
    twLink: false,
    minStandards: {}
  },

  // MATERIALS
  {
    id: 'Mat 01',
    category: 'Mat',
    title: 'Environmental impacts from construction products (LCA)',
    maxCredits: 7,
    defaultTargeted: 4,
    owner: 'design',
    difficulty: 3,
    stageGate: 'RIBA Stage 2 & Stage 4',
    evidenceRequired: 'Whole Building Life Cycle Assessment (LCA) using IMPACT-compliant software at Stage 2 and Stage 4.',
    twLink: true,
    twNote: 'Substructure and retaining wall temporary works optioneering (e.g. reusable steel propping vs sacrificial concrete thrust blocks) reduces embodied carbon.',
    minStandards: {}
  },
  {
    id: 'Mat 02',
    category: 'Mat',
    title: 'Environmental impacts from construction products — EPDs',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'At least 20 construction products across 5 material categories with verified EN 15804 third-party EPDs.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Mat 03',
    category: 'Mat',
    title: 'Responsible sourcing of construction products',
    maxCredits: 4,
    defaultTargeted: 3,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 4–5',
    prerequisiteLabel: 'MANDATORY: 100% of timber and timber-based products used on the project (including temporary works) must be "Legally Harvested and Traded" per UK Government Timber Procurement Policy.',
    evidenceRequired: 'Sustainable Procurement Plan, FSC/PEFC Chain-of-Custody delivery tickets for ALL site timber, BES 6001 / ISO 14001 certificates, and Mat 03 calculator.',
    twLink: true,
    twNote: 'CRITICAL SITE GATE: One uncertified delivery of scaffold boards, formwork ply, hoarding posts, sole plates or timber packing wedges can forfeit the Mat 03 prerequisite and block certification.',
    minStandards: {
      pass: { minCredits: 0, prerequisiteRequired: true, note: 'Mandatory prerequisite: 100% legally harvested & traded timber (including temporary works timber).' },
      good: { minCredits: 0, prerequisiteRequired: true, note: 'Mandatory prerequisite: 100% legally harvested & traded timber.' },
      very_good: { minCredits: 0, prerequisiteRequired: true, note: 'Mandatory prerequisite: 100% legally harvested & traded timber.' },
      excellent: { minCredits: 0, prerequisiteRequired: true, note: 'Mandatory prerequisite: 100% legally harvested & traded timber.' },
      outstanding: { minCredits: 0, prerequisiteRequired: true, note: 'Mandatory prerequisite: 100% legally harvested & traded timber.' }
    }
  },
  {
    id: 'Mat 05',
    category: 'Mat',
    title: 'Designing for durability and resilience',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Vulnerable area protection details (bollards, kickplates, corner guards) and material degradation mitigation.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Mat 06',
    category: 'Mat',
    title: 'Material efficiency',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 2–4',
    evidenceRequired: 'Stage-by-stage material efficiency workshop minutes and structural/fabric optimisation register.',
    twLink: true,
    twNote: 'Designing working platforms to BR 470 with geogrid reinforcement typically cuts imported stone thickness by 30–45%, directly evidencing Mat 06.',
    minStandards: {}
  },

  // WASTE
  {
    id: 'Wst 01',
    category: 'Wst',
    title: 'Construction waste management',
    maxCredits: 5,
    defaultTargeted: 3,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 2–5',
    evidenceRequired: 'Pre-demolition / pre-refurbishment audit (if applicable), Resource Management Plan (RMP), waste carrier licences and monthly waste transfer notes.',
    twLink: true,
    twNote: 'Crushing demolition arisings on site for reuse in BR 470 piling mats and crane platforms avoids muck-away and counts toward waste diversion.',
    minStandards: {
      outstanding: { minCredits: 1, note: 'At least 1 credit in Wst 01 required for Outstanding.' }
    }
  },
  {
    id: 'Wst 02',
    category: 'Wst',
    title: 'Use of recycled and sustainably sourced aggregates',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'Aggregate tonnage schedule, WRAP Quality Protocol certificates (6F2 / Type 1 recycled) and haulage distance records.',
    twLink: true,
    twNote: 'Temporary works working platforms, haul roads and crane hardstandings are the largest consumers of coarse aggregate on site—specifying WRAP-compliant recycled aggregate locks in Wst 02.',
    minStandards: {}
  },
  {
    id: 'Wst 03',
    category: 'Wst',
    title: 'Operational waste',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 3–4',
    evidenceRequired: 'Dedicated, accessible recyclable waste storage area drawings with water outlet and compactor/baler space.',
    twLink: false,
    minStandards: {
      excellent: { minCredits: 1, note: 'Operational waste credit (Wst 03) is mandatory for Excellent.' },
      outstanding: { minCredits: 1, note: 'Operational waste credit (Wst 03) is mandatory for Outstanding.' }
    }
  },
  {
    id: 'Wst 05',
    category: 'Wst',
    title: 'Adaptation to climate change',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 2–4',
    evidenceRequired: 'Climate change structural and fabric resilience risk assessment and mitigation schedule.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Wst 06',
    category: 'Wst',
    title: 'Design for disassembly and adaptability',
    maxCredits: 2,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 2–4',
    evidenceRequired: 'Functional adaptability study and disassembly/re-use implementation drawings.',
    twLink: false,
    minStandards: {}
  },

  // LAND USE & ECOLOGY
  {
    id: 'LE 01',
    category: 'LE',
    title: 'Site selection',
    maxCredits: 2,
    defaultTargeted: 1,
    owner: 'client',
    difficulty: 2,
    stageGate: 'RIBA Stage 1–2',
    evidenceRequired: 'Previously occupied/brownfield land boundary plan (≥75% brownfield footprint) and contaminated land remediation report.',
    twLink: true,
    twNote: 'Brownfield sites frequently contain buried basements, soft spots and backfilled trenches requiring careful temporary works ground verification.',
    minStandards: {}
  },
  {
    id: 'LE 02',
    category: 'LE',
    title: 'Identifying and understanding the risks and opportunities for the project',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'client',
    difficulty: 1,
    stageGate: 'RIBA Stage 1–2',
    prerequisiteLabel: 'Assessment route selection and statutory ecological compliance verification.',
    evidenceRequired: 'Suitably Qualified Ecologist (SQE) early survey report prior to site clearance or demolition works.',
    twLink: true,
    twNote: 'CRITICAL TIMING: SQE survey must be completed BEFORE any site clearance, hoarding erection, trial pits or piling mat installation.',
    minStandards: {}
  },
  {
    id: 'LE 03',
    category: 'LE',
    title: 'Managing negative impacts on ecology',
    maxCredits: 3,
    defaultTargeted: 2,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 2–5',
    prerequisiteLabel: 'Compliance with all UK wildlife and ecological legislation on site.',
    evidenceRequired: 'Site ecological protection plan, tree root protection fencing photos (BS 5837), and CEMP biodiversity logs.',
    twLink: true,
    twNote: 'Hoarding post excavations, sheet piling and crane outrigger pads must stay strictly outside Tree Root Protection Areas (RPAs) or use no-dig cellular confinement systems.',
    minStandards: {}
  },
  {
    id: 'LE 04',
    category: 'LE',
    title: 'Change and enhancement of ecological value',
    maxCredits: 4,
    defaultTargeted: 3,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 3–5',
    evidenceRequired: 'BREEAM Change in Ecological Value calculator / Biodiversity Net Gain (BNG) metric and landscape planting schedule.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'LE 05',
    category: 'LE',
    title: 'Long term Ecology Management and Maintenance',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'contractor',
    difficulty: 1,
    stageGate: 'RIBA Stage 5–6',
    evidenceRequired: 'SQE site audit confirming ecological protection & planting implementation, plus 5-year Landscape & Habitat Management Plan.',
    twLink: false,
    minStandards: {}
  },

  // POLLUTION
  {
    id: 'Pol 01',
    category: 'Pol',
    title: 'Impact of refrigerants',
    maxCredits: 3,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Refrigerant schedule (GWP ≤ 10 or DELC calculation) and automatic permanent refrigerant leak detection specification.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Pol 02',
    category: 'Pol',
    title: 'Local air quality',
    maxCredits: 2,
    defaultTargeted: 2,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'Zero combustion / heat pump heating specification or ultra-low NOx emission compliance calculation.',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Pol 03',
    category: 'Pol',
    title: 'Flood and surface water runoff',
    maxCredits: 5,
    defaultTargeted: 3,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 3–4',
    evidenceRequired: 'Site-Specific Flood Risk Assessment (FRA), SuDS attenuation design for 1-in-100-year + climate change storm, and oil interceptors.',
    twLink: true,
    twNote: 'During construction, temporary excavation dewatering, silt busters and free-draining granular working platforms must prevent sediment discharge into watercourses.',
    minStandards: {}
  },
  {
    id: 'Pol 04',
    category: 'Pol',
    title: 'Reduction of night time light pollution',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 1,
    stageGate: 'RIBA Stage 4',
    evidenceRequired: 'External lighting design compliant with ILP Guidance Note 01 (obtrusive light limits and 23:00–07:00 curfew).',
    twLink: false,
    minStandards: {}
  },
  {
    id: 'Pol 05',
    category: 'Pol',
    title: 'Reduction of noise pollution',
    maxCredits: 1,
    defaultTargeted: 1,
    owner: 'design',
    difficulty: 2,
    stageGate: 'RIBA Stage 4–5',
    evidenceRequired: 'BS 4142 environmental noise assessment by SQA and attenuation verification of fixed building services plant.',
    twLink: false,
    minStandards: {}
  },

  // INNOVATION
  {
    id: 'Inn 01',
    category: 'Inn',
    title: 'Innovation & Exemplary Level Credits',
    maxCredits: 10,
    defaultTargeted: 2,
    owner: 'contractor',
    difficulty: 2,
    stageGate: 'RIBA Stage 2–5',
    evidenceRequired: 'Exemplary performance evidence in Man 03 (CCS ≥40/45), Wst 01 (waste diversion ≥85% weight), Mat 03, Mat 01 or Ene 01.',
    twLink: true,
    twNote: 'Contractors frequently secure +2% Innovation bonus directly on site via Exemplary Man 03 (CCS score ≥40) and Exemplary Wst 01 (reusing crushed arisings in temporary platforms).',
    minStandards: {}
  }
];

/**
 * Project Preset Templates for instant realistic scoring
 */
export const PROJECT_PRESETS = {
  'commercial-office-excellent': {
    id: 'commercial-office-excellent',
    name: 'Commercial Office / Urban Mixed-Use (Target: Excellent 70%+)',
    schemeId: 'nc-fully-fitted',
    targetBand: 'excellent',
    giaM2: 8500,
    contractValueGbp: 24500000,
    stage: 'RIBA Stage 4 / Pre-Construction',
    timberPrerequisiteMet: true,
    credits: {
      'Man 01': 4, 'Man 02': 3, 'Man 03': 5, 'Man 04': 3, 'Man 05': 2,
      'Hea 01': 4, 'Hea 02': 3, 'Hea 04': 3, 'Hea 05': 3, 'Hea 06': 2, 'Hea 07': 2,
      'Ene 01': 9, 'Ene 02': 2, 'Ene 03': 1, 'Ene 04': 3, 'Ene 06': 2,
      'Tra 01': 2, 'Tra 02': 7,
      'Wat 01': 4, 'Wat 02': 1, 'Wat 03': 2, 'Wat 04': 1,
      'Mat 01': 5, 'Mat 02': 1, 'Mat 03': 3, 'Mat 05': 1, 'Mat 06': 1,
      'Wst 01': 4, 'Wst 02': 1, 'Wst 03': 1, 'Wst 05': 1, 'Wst 06': 1,
      'LE 01': 2, 'LE 02': 2, 'LE 03': 3, 'LE 04': 3, 'LE 05': 2,
      'Pol 01': 2, 'Pol 02': 2, 'Pol 03': 4, 'Pol 04': 1, 'Pol 05': 1,
      'Inn 01': 2
    }
  },
  'industrial-logistics-vg': {
    id: 'industrial-logistics-vg',
    name: 'Industrial / Logistics Shed — Shell & Core (Target: Very Good 55%+)',
    schemeId: 'nc-shell-core',
    targetBand: 'very_good',
    giaM2: 18000,
    contractValueGbp: 16800000,
    stage: 'RIBA Stage 5 (Construction Phase)',
    timberPrerequisiteMet: true,
    credits: {
      'Man 01': 3, 'Man 02': 2, 'Man 03': 5, 'Man 04': 2, 'Man 05': 1,
      'Hea 01': 2, 'Hea 02': 2, 'Hea 04': 2, 'Hea 05': 2, 'Hea 06': 2, 'Hea 07': 1,
      'Ene 01': 6, 'Ene 02': 2, 'Ene 03': 1, 'Ene 04': 2, 'Ene 06': 1,
      'Tra 01': 2, 'Tra 02': 5,
      'Wat 01': 3, 'Wat 02': 1, 'Wat 03': 2, 'Wat 04': 1,
      'Mat 01': 4, 'Mat 02': 1, 'Mat 03': 3, 'Mat 05': 1, 'Mat 06': 1,
      'Wst 01': 4, 'Wst 02': 1, 'Wst 03': 1, 'Wst 05': 1, 'Wst 06': 1,
      'LE 01': 1, 'LE 02': 2, 'LE 03': 2, 'LE 04': 2, 'LE 05': 1,
      'Pol 01': 2, 'Pol 02': 2, 'Pol 03': 3, 'Pol 04': 1, 'Pol 05': 1,
      'Inn 01': 1
    }
  },
  'data-centre-outstanding': {
    id: 'data-centre-outstanding',
    name: 'Hyperscale Data Centre / High-Spec Tech Campus (Target: Outstanding 85%+)',
    schemeId: 'nc-fully-fitted',
    targetBand: 'outstanding',
    giaM2: 22000,
    contractValueGbp: 95000000,
    stage: 'RIBA Stage 3–4 (Technical Design)',
    timberPrerequisiteMet: true,
    credits: {
      'Man 01': 4, 'Man 02': 4, 'Man 03': 6, 'Man 04': 4, 'Man 05': 3,
      'Hea 01': 5, 'Hea 02': 4, 'Hea 04': 3, 'Hea 05': 3, 'Hea 06': 2, 'Hea 07': 2,
      'Ene 01': 11, 'Ene 02': 2, 'Ene 03': 1, 'Ene 04': 3, 'Ene 06': 3,
      'Tra 01': 2, 'Tra 02': 8,
      'Wat 01': 4, 'Wat 02': 1, 'Wat 03': 2, 'Wat 04': 1,
      'Mat 01': 6, 'Mat 02': 1, 'Mat 03': 4, 'Mat 05': 1, 'Mat 06': 1,
      'Wst 01': 5, 'Wst 02': 1, 'Wst 03': 1, 'Wst 05': 1, 'Wst 06': 2,
      'LE 01': 2, 'LE 02': 2, 'LE 03': 3, 'LE 04': 4, 'LE 05': 2,
      'Pol 01': 3, 'Pol 02': 2, 'Pol 03': 4, 'Pol 04': 1, 'Pol 05': 1,
      'Inn 01': 5
    }
  },
  'refurbishment-fitout-excellent': {
    id: 'refurbishment-fitout-excellent',
    name: 'Structural Refurbishment & Cut-and-Carve Fit-Out (Target: Excellent 70%+)',
    schemeId: 'rfo-full',
    targetBand: 'excellent',
    giaM2: 4200,
    contractValueGbp: 9800000,
    stage: 'RIBA Stage 5 (Temporary Propping & Strip-Out)',
    timberPrerequisiteMet: true,
    credits: {
      'Man 01': 3, 'Man 02': 2, 'Man 03': 5, 'Man 04': 3, 'Man 05': 2,
      'Hea 01': 4, 'Hea 02': 4, 'Hea 04': 2, 'Hea 05': 3, 'Hea 06': 2, 'Hea 07': 1,
      'Ene 01': 8, 'Ene 02': 2, 'Ene 03': 1, 'Ene 04': 2, 'Ene 06': 2,
      'Tra 01': 2, 'Tra 02': 7,
      'Wat 01': 3, 'Wat 02': 1, 'Wat 03': 2, 'Wat 04': 1,
      'Mat 01': 5, 'Mat 02': 1, 'Mat 03': 3, 'Mat 05': 1, 'Mat 06': 1,
      'Wst 01': 4, 'Wst 02': 1, 'Wst 03': 1, 'Wst 05': 1, 'Wst 06': 2,
      'LE 01': 2, 'LE 02': 2, 'LE 03': 2, 'LE 04': 2, 'LE 05': 2,
      'Pol 01': 2, 'Pol 02': 2, 'Pol 03': 3, 'Pol 04': 1, 'Pol 05': 1,
      'Inn 01': 2
    }
  },
  'at-risk-rescue-audit': {
    id: 'at-risk-rescue-audit',
    name: 'At-Risk Site Audit — Missing Minimum Standards (Diagnostic Demo)',
    schemeId: 'nc-fully-fitted',
    targetBand: 'excellent',
    giaM2: 6400,
    contractValueGbp: 18500000,
    stage: 'RIBA Stage 5 (Mid-Construction Rescue)',
    timberPrerequisiteMet: true,
    credits: {
      'Man 01': 3, 'Man 02': 3, 'Man 03': 0, 'Man 04': 2, 'Man 05': 0,
      'Hea 01': 4, 'Hea 02': 3, 'Hea 04': 2, 'Hea 05': 3, 'Hea 06': 2, 'Hea 07': 2,
      'Ene 01': 3, 'Ene 02': 1, 'Ene 03': 1, 'Ene 04': 2, 'Ene 06': 2,
      'Tra 01': 2, 'Tra 02': 7,
      'Wat 01': 3, 'Wat 02': 1, 'Wat 03': 2, 'Wat 04': 1,
      'Mat 01': 5, 'Mat 02': 1, 'Mat 03': 3, 'Mat 05': 1, 'Mat 06': 1,
      'Wst 01': 3, 'Wst 02': 1, 'Wst 03': 0, 'Wst 05': 1, 'Wst 06': 1,
      'LE 01': 2, 'LE 02': 2, 'LE 03': 3, 'LE 04': 3, 'LE 05': 2,
      'Pol 01': 2, 'Pol 02': 2, 'Pol 03': 4, 'Pol 04': 1, 'Pol 05': 1,
      'Inn 01': 1
    }
  }
};

/**
 * Determine rating band from a numeric score (0–100) without minimum standard overrides
 */
export function getScoreBand(score) {
  const numeric = Number.isFinite(score) ? score : 0;
  for (const band of RATING_BANDS) {
    if (numeric >= band.minScore) {
      return band;
    }
  }
  return RATING_BANDS[RATING_BANDS.length - 1];
}

/**
 * Check whether all minimum standards are met for a specific rating band id
 */
export function checkMinimumStandardsForBand(bandId, creditsMap, excludedMap = {}, timberPrerequisiteMet = true) {
  const failures = [];
  if (bandId === 'unclassified') {
    return { passed: true, failures };
  }

  if (!timberPrerequisiteMet) {
    failures.push({
      issueId: 'Mat 03',
      title: 'Legal & Sustainable Timber Prerequisite (UKTR)',
      requiredCredits: 'Prerequisite',
      achievedCredits: 'Failed',
      note: '100% of site and temporary works timber must be legally harvested and traded.'
    });
  }

  for (const issue of BREEAM_ISSUES) {
    if (excludedMap[issue.id]) continue;
    const rule = issue.minStandards?.[bandId];
    if (!rule) continue;
    const achieved = Math.max(0, Math.min(issue.maxCredits, Number(creditsMap[issue.id] ?? 0)));
    if (achieved < rule.minCredits) {
      failures.push({
        issueId: issue.id,
        title: issue.title,
        requiredCredits: rule.minCredits,
        achievedCredits: achieved,
        shortfall: rule.minCredits - achieved,
        owner: issue.owner,
        note: rule.note
      });
    }
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Core BREEAM Project Score Calculation
 *
 * Returns:
 * - categories: array of per-category breakdown (achieved, available, percentage, weight, weightedScore)
 * - baseWeightedScore: sum of weighted scores across the 9 environmental sections
 * - innovationScore: additive bonus from Inn 01 (1% per credit, up to 10%)
 * - totalScore: capped at 100%
 * - scoreBand: rating band based purely on totalScore percentage
 * - certifiedBand: actual achievable rating band after applying mandatory minimum standards gates
 * - targetBandObj: the target rating band object
 * - targetMinStandards: minimum standards check for the user's target rating band
 * - scoreBandMinStandards: minimum standards check for the raw scoreBand
 * - isDowngradedByMinStandards: boolean
 * - gapToTargetPct: percentage points needed to reach targetBand.minScore
 * - quickWins: ranked list of unachieved credits by highest weighted % per unit of difficulty
 */
export function calculateBreeamScore({
  schemeId = 'nc-fully-fitted',
  targetBand = 'excellent',
  credits = {},
  excluded = {},
  timberPrerequisiteMet = true
} = {}) {
  const scheme = SCHEMES[schemeId] || SCHEMES['nc-fully-fitted'];
  const rawWeights = scheme.weights;

  // Step 1: Aggregate credits per category (excluding 'Inn' which is additive)
  const envCategories = CATEGORIES.filter((c) => c.id !== 'Inn');
  const catStats = {};
  let activeWeightSum = 0;

  for (const cat of envCategories) {
    const issues = BREEAM_ISSUES.filter((i) => i.category === cat.id);
    let achieved = 0;
    let available = 0;

    for (const issue of issues) {
      if (excluded[issue.id]) continue;
      const val = Math.max(0, Math.min(issue.maxCredits, Number(credits[issue.id] ?? 0)));
      achieved += val;
      available += issue.maxCredits;
    }

    const rawWeight = rawWeights[cat.id] || 0;
    if (available > 0) {
      activeWeightSum += rawWeight;
    }

    catStats[cat.id] = {
      ...cat,
      achievedCredits: achieved,
      availableCredits: available,
      rawWeight
    };
  }

  // Step 2: Re-normalise weights if an entire category is excluded, then compute weighted score
  let baseWeightedScore = 0;
  const categoryBreakdown = [];

  for (const cat of envCategories) {
    const stat = catStats[cat.id];
    const effectiveWeight =
      stat.availableCredits > 0 && activeWeightSum > 0
        ? (stat.rawWeight / activeWeightSum) * 100
        : 0;
    const percentageAchieved =
      stat.availableCredits > 0 ? (stat.achievedCredits / stat.availableCredits) * 100 : 0;
    const weightedContribution = (percentageAchieved * effectiveWeight) / 100;
    baseWeightedScore += weightedContribution;

    categoryBreakdown.push({
      id: stat.id,
      code: stat.code,
      name: stat.name,
      summary: stat.summary,
      siteNote: stat.siteNote,
      achievedCredits: stat.achievedCredits,
      availableCredits: stat.availableCredits,
      percentageAchieved: round2(percentageAchieved),
      effectiveWeight: round2(effectiveWeight),
      weightedContribution: round2(weightedContribution),
      unachievedWeightedPct: round2(effectiveWeight - weightedContribution)
    });
  }

  // Step 3: Innovation credits (additive 1% per credit, max 10%, total score capped at 100%)
  const innIssue = BREEAM_ISSUES.find((i) => i.id === 'Inn 01');
  const innMax = excluded['Inn 01'] ? 0 : innIssue.maxCredits;
  const innAchieved = excluded['Inn 01']
    ? 0
    : Math.max(0, Math.min(innMax, Number(credits['Inn 01'] ?? 0)));
  const innovationScore = innAchieved * 1.0;

  const innCatMeta = CATEGORIES.find((c) => c.id === 'Inn');
  categoryBreakdown.push({
    id: 'Inn',
    code: 'INN',
    name: innCatMeta.name,
    summary: innCatMeta.summary,
    siteNote: innCatMeta.siteNote,
    achievedCredits: innAchieved,
    availableCredits: innMax,
    percentageAchieved: innMax > 0 ? round2((innAchieved / innMax) * 100) : 0,
    effectiveWeight: 10.0,
    weightedContribution: round2(innovationScore),
    unachievedWeightedPct: round2(innMax - innovationScore),
    isAdditive: true
  });

  const rawTotalScore = Math.min(100, baseWeightedScore + innovationScore);
  const totalScore = round2(rawTotalScore);

  // Step 4: Determine Score Band vs Certified Band (enforcing Minimum Standards)
  const scoreBand = getScoreBand(totalScore);
  const scoreBandMinStandards = checkMinimumStandardsForBand(
    scoreBand.id,
    credits,
    excluded,
    timberPrerequisiteMet
  );

  // Walk down from scoreBand until a band's minimum standards are satisfied
  let certifiedBand = RATING_BANDS[RATING_BANDS.length - 1]; // unclassified fallback
  const startIdx = RATING_BANDS.findIndex((b) => b.id === scoreBand.id);
  for (let idx = startIdx; idx < RATING_BANDS.length; idx++) {
    const candidate = RATING_BANDS[idx];
    const check = checkMinimumStandardsForBand(
      candidate.id,
      credits,
      excluded,
      timberPrerequisiteMet
    );
    if (check.passed) {
      certifiedBand = candidate;
      break;
    }
  }

  const targetBandObj =
    RATING_BANDS.find((b) => b.id === targetBand) ||
    RATING_BANDS.find((b) => b.id === 'excellent');
  const targetMinStandards = checkMinimumStandardsForBand(
    targetBandObj.id,
    credits,
    excluded,
    timberPrerequisiteMet
  );

  const isDowngradedByMinStandards = certifiedBand.id !== scoreBand.id;
  const gapToTargetPct = round2(Math.max(0, targetBandObj.minScore - totalScore));
  const marginAboveTargetPct = round2(Math.max(0, totalScore - targetBandObj.minScore));

  // Step 5: Compute per-issue value and rank Quick Wins / Gap-Closing Opportunities
  const catMap = Object.fromEntries(categoryBreakdown.map((c) => [c.id, c]));
  const issueDetails = BREEAM_ISSUES.map((issue) => {
    const isExcluded = Boolean(excluded[issue.id]);
    const achieved = isExcluded
      ? 0
      : Math.max(0, Math.min(issue.maxCredits, Number(credits[issue.id] ?? 0)));
    const remaining = isExcluded ? 0 : issue.maxCredits - achieved;

    const cat = catMap[issue.category];
    let pctPerCredit = 0;
    if (!isExcluded) {
      if (issue.category === 'Inn') {
        pctPerCredit = 1.0;
      } else if (cat && cat.availableCredits > 0) {
        pctPerCredit = cat.effectiveWeight / cat.availableCredits;
      }
    }

    const achievedWeightedPct = round2(achieved * pctPerCredit);
    const remainingWeightedPct = round2(remaining * pctPerCredit);
    const isMinStandardFailureForTarget = targetMinStandards.failures.some(
      (f) => f.issueId === issue.id
    );

    // Priority index rewards: mandatory gate fixes first, then high % per credit & low difficulty
    const efficiencyScore =
      (pctPerCredit / (issue.difficulty || 1)) *
      (issue.owner === 'contractor' ? 1.25 : 1.0) *
      (isMinStandardFailureForTarget ? 10 : 1);

    return {
      ...issue,
      isExcluded,
      achievedCredits: achieved,
      remainingCredits: remaining,
      pctPerCredit: round2(pctPerCredit),
      achievedWeightedPct,
      remainingWeightedPct,
      isMinStandardFailureForTarget,
      efficiencyScore: round2(efficiencyScore)
    };
  });

  const quickWins = issueDetails
    .filter((i) => !i.isExcluded && i.remainingCredits > 0)
    .sort((a, b) => {
      if (a.isMinStandardFailureForTarget !== b.isMinStandardFailureForTarget) {
        return a.isMinStandardFailureForTarget ? -1 : 1;
      }
      if (b.efficiencyScore !== a.efficiencyScore) {
        return b.efficiencyScore - a.efficiencyScore;
      }
      return b.remainingWeightedPct - a.remainingWeightedPct;
    });

  // Owner responsibility summary
  const ownerSummary = {
    contractor: { achievedPct: 0, availablePct: 0, achievedCredits: 0, availableCredits: 0 },
    design: { achievedPct: 0, availablePct: 0, achievedCredits: 0, availableCredits: 0 },
    client: { achievedPct: 0, availablePct: 0, achievedCredits: 0, availableCredits: 0 }
  };

  for (const item of issueDetails) {
    if (item.isExcluded) continue;
    const bucket = ownerSummary[item.owner] || ownerSummary.design;
    bucket.achievedCredits += item.achievedCredits;
    bucket.availableCredits += item.maxCredits;
    bucket.achievedPct = round2(bucket.achievedPct + item.achievedWeightedPct);
    bucket.availablePct = round2(bucket.availablePct + item.maxCredits * item.pctPerCredit);
  }

  return {
    scheme,
    categories: categoryBreakdown,
    issues: issueDetails,
    baseWeightedScore: round2(baseWeightedScore),
    innovationScore: round2(innovationScore),
    totalScore,
    scoreBand,
    certifiedBand,
    targetBandObj,
    targetMinStandards,
    scoreBandMinStandards,
    isDowngradedByMinStandards,
    gapToTargetPct,
    marginAboveTargetPct,
    timberPrerequisiteMet,
    quickWins,
    ownerSummary
  };
}

/**
 * Site Credit Helper 1: Man 03 Responsible Construction Practices Calculator
 * Calculates achievable Man 03 credits (out of 6) + Exemplary Innovation credit (1)
 */
export function calculateMan03SiteCredits({
  uktrLegalTimberConfirmed = true,
  emsCertified = true,
  sustainabilityChampionAppointed = true,
  ccsScore = 39, // Considerate Constructors Scheme score (typically out of 45 or 50)
  energyMonitoring = true,
  waterMonitoring = true,
  transportMonitoring = true
} = {}) {
  if (!uktrLegalTimberConfirmed) {
    return {
      prerequisitePassed: false,
      credits: 0,
      maxCredits: 6,
      exemplaryCredit: 0,
      breakdown: [
        'PREREQUISITE FAILED: All site and temporary works timber must be legally harvested and traded (UKTR).'
      ]
    };
  }

  let credits = 0;
  let exemplaryCredit = 0;
  const breakdown = [];

  if (emsCertified) {
    credits += 1;
    breakdown.push('+1 credit: Environmental Management System (ISO 14001 / EMAS) operated by Principal Contractor.');
  } else {
    breakdown.push('0/1 credit: Principal Contractor lacks certified Environmental Management System.');
  }

  if (sustainabilityChampionAppointed) {
    credits += 1;
    breakdown.push('+1 credit: BREEAM Sustainability Champion appointed to monitor site compliance during construction.');
  } else {
    breakdown.push('0/1 credit: No dedicated BREEAM Sustainability Champion appointed for construction stage.');
  }

  const numericCcs = Number(ccsScore) || 0;
  if (numericCcs >= 40) {
    credits += 2;
    exemplaryCredit = 1;
    breakdown.push(`+2 credits (+1 Exemplary Inn credit): CCS score of ${numericCcs} achieves full compliance and Exemplary Innovation threshold (≥40).`);
  } else if (numericCcs >= 35) {
    credits += 2;
    breakdown.push(`+2 credits: CCS score of ${numericCcs} achieves full BREEAM Considerate Construction credits (35–39).`);
  } else if (numericCcs >= 30) {
    credits += 1;
    breakdown.push(`+1 credit: CCS score of ${numericCcs} achieves 1 Considerate Construction credit (30–34).`);
  } else {
    breakdown.push(`0/2 credits: CCS score of ${numericCcs} is below the 30-point threshold required for BREEAM Man 03.`);
  }

  if (energyMonitoring && waterMonitoring) {
    credits += 1;
    breakdown.push('+1 credit: Site utility monitoring (energy kWh, generator fuel litres & mains/bowser water m³) logged and targeted.');
  } else {
    breakdown.push('0/1 credit: Both site energy and site water consumption must be monitored and logged.');
  }

  if (transportMonitoring) {
    credits += 1;
    breakdown.push('+1 credit: Transport of construction materials and waste (delivery distances, vehicle movements & fuel) monitored.');
  } else {
    breakdown.push('0/1 credit: Material delivery and muck-away transport movements not logged.');
  }

  return {
    prerequisitePassed: true,
    credits: Math.min(6, credits),
    maxCredits: 6,
    exemplaryCredit,
    breakdown
  };
}

/**
 * Site Credit Helper 2: Wst 01 & Wst 02 Construction Waste & Working Platform Calculator
 * Evaluates construction waste generation per 100 m² GIA, diversion from landfill %,
 * pre-demolition audit, and recycled aggregate reuse in BR 470 temporary platforms.
 */
export function calculateWst01SiteCredits({
  hasRmp = true,
  wasteTonnesPer100m2 = 6.2,
  diversionByWeightPct = 86,
  preDemolitionAuditDone = true,
  recycledAggregatePct = 35
} = {}) {
  const breakdown = [];
  let wst01Credits = 0;
  let exemplaryCredit = 0;

  if (!hasRmp) {
    return {
      wst01Credits: 0,
      wst02Credits: 0,
      exemplaryCredit: 0,
      breakdown: [
        '0 credits: Compliant Resource Management Plan (RMP) is required to unlock Wst 01 construction waste credits.'
      ]
    };
  }

  const tonnes = Number(wasteTonnesPer100m2) || 0;
  if (tonnes <= 1.6) {
    wst01Credits += 3;
    exemplaryCredit = 1;
    breakdown.push(`+3 credits (+1 Exemplary): Waste generation (${tonnes} t/100m² GIA) meets Exemplary benchmark (≤1.6 t/100m²).`);
  } else if (tonnes <= 3.4) {
    wst01Credits += 3;
    breakdown.push(`+3 credits: Waste generation (${tonnes} t/100m² GIA) meets 3-credit benchmark (≤3.4 t/100m²).`);
  } else if (tonnes <= 6.5) {
    wst01Credits += 2;
    breakdown.push(`+2 credits: Waste generation (${tonnes} t/100m² GIA) meets 2-credit benchmark (≤6.5 t/100m²).`);
  } else if (tonnes <= 11.1) {
    wst01Credits += 1;
    breakdown.push(`+1 credit: Waste generation (${tonnes} t/100m² GIA) meets 1-credit benchmark (≤11.1 t/100m²).`);
  } else {
    breakdown.push(`0/3 credits: Waste generation (${tonnes} t/100m² GIA) exceeds BREEAM 11.1 t/100m² benchmark.`);
  }

  const diversion = Number(diversionByWeightPct) || 0;
  if (diversion >= 85) {
    wst01Credits += 1;
    if (tonnes <= 3.4) exemplaryCredit = 1;
    breakdown.push(`+1 credit: ${diversion}% non-hazardous waste diverted from landfill (exceeds 85% exemplary diversion threshold).`);
  } else if (diversion >= 70) {
    wst01Credits += 1;
    breakdown.push(`+1 credit: ${diversion}% non-hazardous waste diverted from landfill (meets ≥70% weight requirement).`);
  } else {
    breakdown.push(`0/1 credit: Diversion rate (${diversion}%) is below the 70% by weight threshold.`);
  }

  if (preDemolitionAuditDone) {
    wst01Credits += 1;
    breakdown.push('+1 credit: Pre-demolition / pre-refurbishment audit completed prior to strip-out and integrated into RMP.');
  }

  const aggPct = Number(recycledAggregatePct) || 0;
  const wst02Credits = aggPct >= 25 ? 1 : 0;
  if (wst02Credits === 1) {
    breakdown.push(`+1 Wst 02 credit: ${aggPct}% recycled/secondary aggregate used in piling mats, working platforms & sub-bases (≥25% threshold).`);
  } else {
    breakdown.push(`0/1 Wst 02 credit: Recycled aggregate share (${aggPct}%) is below the 25% high-grade aggregate benchmark.`);
  }

  return {
    wst01Credits: Math.min(5, wst01Credits),
    wst02Credits,
    exemplaryCredit,
    breakdown
  };
}

/**
 * Site Credit Helper 3: Mat 03 Responsible Sourcing & Temporary Works Timber Gate
 */
export function calculateMat03SiteCredits({
  allSiteTimberLegalAndCertified = true,
  sustainableProcurementPlan = true,
  rscsPercentage = 38 // % of available Responsible Sourcing of Construction Products points achieved
} = {}) {
  if (!allSiteTimberLegalAndCertified) {
    return {
      prerequisitePassed: false,
      credits: 0,
      exemplaryCredit: 0,
      breakdown: [
        'CRITICAL PREREQUISITE FAILURE: Uncertified timber detected on site (formwork, scaffold boards, hoardings or permanent timber). Project cannot be certified until 100% legal & sustainable compliance is evidenced.'
      ]
    };
  }

  const breakdown = [
    'Prerequisite PASSED: 100% of permanent and temporary works timber is legally harvested and FSC/PEFC Chain-of-Custody certified.'
  ];

  let credits = 0;
  let exemplaryCredit = 0;

  if (sustainableProcurementPlan) {
    credits += 1;
    breakdown.push('+1 credit: Sustainable Procurement Plan in place and cascaded to trade subcontractors.');
  }

  const pct = Number(rscsPercentage) || 0;
  if (pct >= 54) {
    credits += 3;
    exemplaryCredit = 1;
    breakdown.push(`+3 credits (+1 Exemplary): ${pct}% RSCS points achieved across key building elements (≥54% Exemplary threshold).`);
  } else if (pct >= 36) {
    credits += 3;
    breakdown.push(`+3 credits: ${pct}% RSCS points achieved (≥36% threshold).`);
  } else if (pct >= 18) {
    credits += 2;
    breakdown.push(`+2 credits: ${pct}% RSCS points achieved (≥18% threshold).`);
  } else if (pct >= 10) {
    credits += 1;
    breakdown.push(`+1 credit: ${pct}% RSCS points achieved (≥10% threshold).`);
  } else {
    breakdown.push(`0/3 credits: RSCS score (${pct}%) is below the 10% minimum credit threshold.`);
  }

  return {
    prerequisitePassed: true,
    credits: Math.min(4, credits),
    exemplaryCredit,
    breakdown
  };
}

function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}
