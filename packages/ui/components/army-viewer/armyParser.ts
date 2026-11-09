export interface ArmyMetadata {
  name: string;
  system: string;
  faction: string;
  detachment?: string;
  points: number;
  points_limit?: number;
  raw_system?: string;
}

export interface SpecialUpgradeBadge {
  name: string;
  pts: number;
  color: string;
}

export interface ParsedProfileCharacteristic {
  name: string;
  $text?: string | number;
}

export interface ParsedProfile {
  id?: string;
  name: string;
  typeName?: string;
  characteristics?: ParsedProfileCharacteristic[];
  _count?: number;
}

export interface ParsedRule {
  id?: string;
  name: string;
  description?: string;
}

export interface ParsedUnit {
  id: string;
  name: string;
  points: number;
  role: string;
  forceName: string;
  isWarlord: boolean;
  badges: SpecialUpgradeBadge[];
  modelsText: string;
  wargearText: string;
  totalModels: number;
  leadsNames: string[];
  ledByNames: string[];
  keywords: string[];
  statProfiles: ParsedProfile[];
  rangedWeapons: ParsedProfile[];
  meleeWeapons: ParsedProfile[];
  abilities: ParsedProfile[];
  rules: ParsedRule[];
}

export interface ParsedArmyRoster {
  metadata: ArmyMetadata;
  units: ParsedUnit[];
  armyRules: { name: string; description: string }[];
}

const IGNORED_CATEGORIES = new Set([
  'Configuration', 'Army Configuration', 'Allegiance', 'Open Beta Release',
  'Uncategorized', 'Reference', 'Illegal Units', 'MAY_HAVE_ARMOUR', 'MAY_HAVE_SHIELD'
]);

const PRIMARY_ROLES = [
  'High Command', 'Command', 'Retinue', 'Elites', 'War-engine', 'Troops',
  'Support', 'Transport', 'Heavy Assault', 'Heavy Transport', 'Armour', 'Recon', 'Fast Attack',
  'Epic Hero', 'Character', 'Characters', 'Battleline', 'Core', 'Special', 'Rare', 'Mercenaries',
  'Infantry', 'Mounted', 'Monster', 'Vehicle', 'Dedicated Transport', 'Fortification',
  'HQ', 'Heavy Support', 'Lord of War', 'Primarch', 'Hero', 'Warmachine', 'Beast', 'Swarm'
];

const isPointCost = (c: any): boolean => {
  const n = (c?.name || '').toLowerCase();
  return n === 'pts' || n === 'point(s)' || n === 'points' || n === 'pkt';
};

const getTotalPts = (node: any): number => {
  let pts = 0;
  (node.costs || []).forEach((c: any) => {
    if (isPointCost(c)) pts += Number(c.value || 0);
  });
  (node.selections || []).forEach((sub: any) => {
    pts += getTotalPts(sub);
  });
  return pts;
};

const getPrimaryRole = (unit: any): string => {
  const cats = unit.categories || [];
  const primaryCat = cats.find((c: any) => c.primary);
  if (primaryCat) return primaryCat.name;
  const matchedRole = cats.find((c: any) => PRIMARY_ROLES.includes(c.name));
  return matchedRole ? matchedRole.name : (cats[0]?.name || 'Unit');
};

const getAllKeywords = (unit: any): string[] => {
  const kwSet = new Set<string>();
  (unit.categories || []).forEach((c: any) => {
    if (!IGNORED_CATEGORIES.has(c.name)) kwSet.add(c.name);
  });
  (unit.profiles || []).forEach((p: any) => {
    if (p.typeName === 'Traits') kwSet.add(p.name);
  });
  return Array.from(kwSet);
};

const getSpecialUpgrades = (unit: any) => {
  let isWarlord =
    unit.categories?.some((c: any) => c.name === 'Warlord' || c.name === 'General') || false;
  const badges: SpecialUpgradeBadge[] = [];

  const walk = (sels: any[] = []) => {
    sels.forEach((s) => {
      if (s.name === 'Warlord' || s.name === 'General' || s.categories?.some((c: any) => c.name === 'Warlord')) {
        isWarlord = true;
      }
      const grp = (s.group || '').toLowerCase();
      const isEnhancement =
        grp.includes('enhancement') ||
        grp.includes('arcana') ||
        grp.includes('magic items') ||
        grp.includes('magic standards') ||
        grp.includes('prime benefits') ||
        s.costs?.some((c: any) => c.name === 'Enhancements');

      if (isEnhancement) {
        const ePts = s.costs?.find(isPointCost)?.value || 0;
        badges.push({ name: s.name, pts: ePts, color: 'grape' });
      }
      if (s.selections) walk(s.selections);
    });
  };
  walk(unit.selections);
  return { isWarlord, badges };
};

const getModelBreakdown = (unit: any) => {
  const subModels = (unit.selections || []).filter((s: any) => s.type === 'model');
  const commandUpgrades = (unit.selections || []).filter(
    (s: any) => s.type === 'upgrade' && s.group === 'Command'
  );

  if (subModels.length > 0) {
    const totalModels = subModels.reduce((acc: number, m: any) => acc + (m.number || 1), 0);
    const modelParts = subModels.map((m: any) => `${m.number || 1}x ${m.name}`);
    if (commandUpgrades.length > 0) {
      modelParts.push(`Command: ${commandUpgrades.map((c: any) => c.name).join(', ')}`);
    }
    const modelsText = modelParts.join(', ');

    const gearCounts = new Map<string, number>();
    subModels.forEach((m: any) => {
      (m.selections || []).forEach((g: any) => {
        gearCounts.set(g.name, (gearCounts.get(g.name) || 0) + (g.number || 1));
      });
    });
    (unit.selections || []).forEach((u: any) => {
      if (u.type === 'upgrade' && u.group !== 'Command' && u.name !== 'Prime Unit') {
        gearCounts.set(u.name, (gearCounts.get(u.name) || 0) + (u.number || 1));
      }
    });

    const wargearText = Array.from(gearCounts.entries())
      .map(([name, count]) => (count > 1 ? `${count}x ${name}` : name))
      .join(', ');

    return { modelsText, wargearText, totalModels };
  } else {
    const upgrades = (unit.selections || []).filter(
      (s: any) => s.type === 'upgrade' && s.name !== 'Warlord'
    );
    const wargearText = upgrades
      .map((u: any) => (u.number > 1 ? `${u.number}x ${u.name}` : u.name))
      .join(', ');
    return {
      modelsText: `${unit.number || 1}x ${unit.name}`,
      wargearText,
      totalModels: unit.number || 1,
    };
  }
};

const extractAllProfiles = (node: any) => {
  const statProfiles: ParsedProfile[] = [];
  const rangedWeapons: ParsedProfile[] = [];
  const meleeWeapons: ParsedProfile[] = [];
  const abilities: ParsedProfile[] = [];

  const walk = (curr: any) => {
    (curr.profiles || []).forEach((p: any) => {
      const tName = (p.typeName || '').toLowerCase().trim();
      if (tName === 'traits' || tName === 'base') return;

      const charNames = (p.characteristics || []).map((c: any) => c.name);
      const getVal = (n: string) => p.characteristics?.find((c: any) => c.name === n)?.$text || '';

      const itemWithCount: ParsedProfile = {
        ...p,
        _count: curr.type === 'upgrade' ? (curr.number || 1) : 1,
      };

      const isStatline =
        tName === 'unit' ||
        tName === 'model' ||
        tName === 'profile' ||
        tName === 'vehicle' ||
        tName === 'infantry' ||
        tName === 'warscroll';

      const isRanged =
        tName.includes('ranged') ||
        (tName === 'weapon' &&
          ((charNames.includes('Range') && getVal('Range') !== 'Melee' && getVal('Range') !== 'Combat') ||
            (charNames.includes('R') && getVal('R') !== 'Melee' && getVal('R') !== 'Combat')));

      const isMelee =
        tName.includes('melee') ||
        (tName === 'weapon' &&
          ((charNames.includes('Range') && (getVal('Range') === 'Melee' || getVal('Range') === 'Combat')) ||
            (charNames.includes('R') && (getVal('R') === 'Melee' || getVal('R') === 'Combat'))));

      if (isStatline) {
        statProfiles.push(itemWithCount);
      } else if (isRanged) {
        rangedWeapons.push(itemWithCount);
      } else if (isMelee) {
        meleeWeapons.push(itemWithCount);
      } else {
        abilities.push(itemWithCount);
      }
    });

    (curr.selections || []).forEach((sub: any) => walk(sub));
  };

  walk(node);

  const dedup = (arr: ParsedProfile[]) => {
    const map = new Map<string, ParsedProfile>();
    arr.forEach((item) => {
      const key = `${item.typeName}::${item.id || item.name}`;
      if (!map.has(key)) {
        map.set(key, { ...item });
      } else {
        const existing = map.get(key)!;
        existing._count = (existing._count || 1) + (item._count || 1);
      }
    });
    return Array.from(map.values());
  };

  return {
    statProfiles: dedup(statProfiles),
    rangedWeapons: dedup(rangedWeapons),
    meleeWeapons: dedup(meleeWeapons),
    abilities: dedup(abilities),
  };
};

const extractRules = (node: any): ParsedRule[] => {
  let results: ParsedRule[] = [];
  if (node.rules) results = [...results, ...node.rules];
  if (node.selections) {
    node.selections.forEach((sel: any) => {
      results = [...results, ...extractRules(sel)];
    });
  }
  return Array.from(new Map(results.map((r) => [r.id || r.name, r])).values());
};

export function parseArmyListData(listData: { metadata: ArmyMetadata; roster_data: any }): ParsedArmyRoster {
  const { metadata, roster_data } = listData;
  const roster = roster_data?.roster || {};
  const rootForces = roster?.forces || [];

  const rawUnits: any[] = [];
  const configRules: any[] = [];

  const collectFromSelections = (selections: any[], forceName: string) => {
    selections.forEach((sel: any) => {
      const isConfig =
        sel.categories?.some((c: any) => IGNORED_CATEGORIES.has(c.name)) ||
        sel.type === 'upgrade';

      if (isConfig) {
        if (sel.rules) configRules.push(...sel.rules);
        if (sel.selections) collectFromSelections(sel.selections, forceName);
        return;
      }

      if (sel.type === 'unit' || sel.type === 'model') {
        rawUnits.push({ ...sel, _forceName: forceName });
      } else if (sel.selections) {
        collectFromSelections(sel.selections, forceName);
      }
    });
  };

  const traverseForces = (forceList: any[]) => {
    forceList.forEach((force: any) => {
      const fName = force.name || '';
      if (force.rules) configRules.push(...force.rules);
      if (force.selections) collectFromSelections(force.selections, fName);
      if (force.forces) traverseForces(force.forces);
    });
  };

  traverseForces(rootForces);

  const unitNameMap = new Map<string, string>();
  rawUnits.forEach((u) => unitNameMap.set(u.id, u.name));

  const ledByMap = new Map<string, string[]>();
  rawUnits.forEach((u) => {
    (u.associations || []).forEach((assoc: any) => {
      if (assoc.name === 'Leading' && assoc.to) {
        const current = ledByMap.get(assoc.to) || [];
        if (!current.includes(u.name)) {
          ledByMap.set(assoc.to, [...current, u.name]);
        }
      }
    });
  });

  const allArmyRulesMap = new Map<string, string>();
  configRules.forEach((r: any) => {
    if (r.name && r.description) allArmyRulesMap.set(r.name, r.description);
  });

  const units: ParsedUnit[] = rawUnits.map((unit: any) => {
    const points = getTotalPts(unit);
    const role = getPrimaryRole(unit);
    const keywords = getAllKeywords(unit);
    const { isWarlord, badges } = getSpecialUpgrades(unit);
    const { modelsText, wargearText, totalModels } = getModelBreakdown(unit);
    const { statProfiles, rangedWeapons, meleeWeapons, abilities } = extractAllProfiles(unit);
    const rules = extractRules(unit);

    rules.forEach((r) => {
      if (r.name && r.description) allArmyRulesMap.set(r.name, r.description);
    });

    const leadsNames = (unit.associations || [])
      .filter((a: any) => a.name === 'Leading')
      .map((a: any) => unitNameMap.get(a.to))
      .filter(Boolean) as string[];

    const ledByNames = ledByMap.get(unit.id) || [];

    return {
      id: unit.id,
      name: unit.name,
      points,
      role,
      forceName: unit._forceName || '',
      isWarlord,
      badges,
      modelsText,
      wargearText,
      totalModels,
      leadsNames,
      ledByNames,
      keywords,
      statProfiles,
      rangedWeapons,
      meleeWeapons,
      abilities,
      rules,
    };
  });

  const armyRules = Array.from(allArmyRulesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, description]) => ({ name, description }));

  return {
    metadata,
    units,
    armyRules,
  };
}