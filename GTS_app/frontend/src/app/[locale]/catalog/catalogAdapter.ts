export interface CatalogSystemDto {
  id: string;
  name: string;
  github_repo: string;
  last_sync_sha: string | null;
  last_synced_at: string | null;
  factions_count: number;
}

export interface CatalogFactionDto {
  id: string;
  name: string;
  bs_uuid: string;
  revision: string | null;
  is_library: boolean;
}

export interface RawBsProfile {
  id?: string;
  name: string;
  type_name: string;
  characteristics: Record<string, string>;
}

export interface RawBsOption {
  id?: string;
  name: string;
  type: string;
  points: number;
  profiles: RawBsProfile[];
}

export interface CatalogEntryDto {
  id: string;
  bs_uuid: string;
  name: string;
  entry_type: string;
  base_points: number;
  profile_data: {
    profiles?: RawBsProfile[];
    keywords?: string[];
    options?: RawBsOption[];
  };
}

/**
 * Converts our backend's { [statName]: value } dictionary into the BattleScribe array
 * format [{ name, $text }] expected by ArmyStatTablesBySchema & ArmyUnitDatasheet.
 */
function toBsCharacteristicsArray(charsRecord: Record<string, string> = {}) {
  return Object.entries(charsRecord).map(([name, val]) => ({
    name,
    $text: val ?? '',
  }));
}

function classifyProfileType(typeName: string): 'stat' | 'ranged' | 'melee' | 'ability' {
  const t = (typeName || '').toLowerCase();
  if (
    t.includes('ranged') ||
    t.includes('shooting') ||
    t.includes('missile') ||
    t.includes('firearm')
  ) {
    return 'ranged';
  }
  if (t.includes('melee') || t.includes('close combat') || t === 'ccw') {
    return 'melee';
  }
  if (
    t === 'unit' ||
    t === 'model' ||
    t.includes('stat') ||
    t.includes('characteristic') ||
    t.includes('operative') ||
    t.includes('warscroll') ||
    t.includes('vehicle')
  ) {
    return 'stat';
  }
  if (t.includes('weapon')) {
    return 'ranged';
  }
  return 'ability';
}

const PRIMARY_ROLE_KEYWORDS = [
  'Epic Hero',
  'Character',
  'Battleline',
  'Infantry',
  'Vehicle',
  'Monster',
  'Mounted',
  'Dedicated Transport',
  'Fortification',
  'Hero',
  'Warmachine',
  'Leader',
  'Elites',
  'Troops',
  'Heavy Support',
  'Fast Attack',
  'HQ',
];

/**
 * Maps a backend CatalogEntryDto into a ParsedUnit compatible with <ArmyUnitDatasheet />
 */
export function catalogEntryToParsedUnit(entry: CatalogEntryDto, factionName?: string): any {
  const rawProfiles = entry.profile_data?.profiles || [];
  const rawOptions = entry.profile_data?.options || [];
  const rawKeywords = entry.profile_data?.keywords || [];

  const statProfiles: any[] = [];
  const rangedWeapons: any[] = [];
  const meleeWeapons: any[] = [];
  const abilities: any[] = [];

  const seenProfileKeys = new Set<string>();

  const processProfile = (p: RawBsProfile, count = 1) => {
    const dedupeKey = `${p.type_name}::${p.name}`;
    if (seenProfileKeys.has(dedupeKey)) return;
    seenProfileKeys.add(dedupeKey);

    const formatted = {
      id: p.id || p.name,
      name: p.name,
      typeName: p.type_name || 'Profile',
      count,
      characteristics: toBsCharacteristicsArray(p.characteristics),
    };

    const bucket = classifyProfileType(p.type_name);
    if (bucket === 'stat') statProfiles.push(formatted);
    else if (bucket === 'ranged') rangedWeapons.push(formatted);
    else if (bucket === 'melee') meleeWeapons.push(formatted);
    else abilities.push(formatted);
  };

  // 1. Process top-level unit profiles
  rawProfiles.forEach((p) => processProfile(p, 1));

  // 2. Process nested options (weapons, wargear, sub-models)
  const wargearNames: string[] = [];
  const modelNames: string[] = [];

  rawOptions.forEach((opt) => {
    const label = opt.points > 0 ? `${opt.name} (+${opt.points} pts)` : opt.name;
    if (opt.type === 'model') {
      modelNames.push(label);
    } else if (opt.name) {
      wargearNames.push(label);
    }
    (opt.profiles || []).forEach((p) => processProfile(p, 1));
  });

  // Determine primary role badge
  const matchedRole = rawKeywords.find((kw) =>
    PRIMARY_ROLE_KEYWORDS.some((r) => kw.toLowerCase() === r.toLowerCase())
  );
  const role = matchedRole || entry.entry_type.toUpperCase();

  // Strip out "Faction: ..." prefix noise if needed for clean keyword display
  const cleanKeywords = rawKeywords.filter((k) => k && !k.startsWith('Configuration'));

  return {
    id: entry.id,
    name: entry.name,
    role,
    forceName: factionName || 'Army Roster',
    totalModels: 1,
    points: entry.base_points || 0,
    isWarlord: false,
    badges: [],
    leadsNames: [],
    ledByNames: [],
    modelsText: modelNames.length > 0 ? modelNames.join(', ') : entry.name,
    wargearText: wargearNames.slice(0, 12).join(', '),
    statProfiles,
    rangedWeapons,
    meleeWeapons,
    abilities,
    rules: [],
    keywords: cleanKeywords,
  };
}