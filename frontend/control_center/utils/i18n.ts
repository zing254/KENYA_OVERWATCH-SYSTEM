// Minimal internationalization helper for Kenya Overwatch front-end
export type Lang = 'en' | 'sw'

const DICTIONARY: Record<Lang, Record<string, string>> = {
  en: {
    'Dashboard': 'Dashboard',
    'Speed Cams': 'Speed Cams',
    'Satellite': 'Satellite',
    'Vehicles': 'Vehicles',
    'Dispatch': 'Dispatch',
    'Citizen Reports': 'Citizen Reports',
    'Team Chat': 'Team Chat',
    'System Logs': 'System Logs',
    'Analytics': 'Analytics',
    'Reports': 'Reports',
    'County Analysis': 'County Analysis',
    'Settings': 'Settings',
    'KENYA_OVERWATCH': 'KENYA OVERWATCH',
    'COMMAND_CENTER': 'Command Center',
    'KENYA_OVERWATCH_SYSTEM': 'KENYA OVERWATCH SYSTEM',
  },
  sw: {
    'Dashboard': 'Dashibodi',
    'Speed Cams': 'Kamera za Kasi',
    'Satellite': 'Satelliti',
    'Vehicles': 'Magari',
    'Dispatch': 'Utekelezaji',
    'Citizen Reports': 'Ripoti za Wananchi',
    'Team Chat': 'Gumzo la Timu',
    'System Logs': 'Nakala za Mfumo',
    'Analytics': 'Takwimu',
    'Reports': 'Ripoti',
    'County Analysis': 'Uchambuzi wa Kaunti',
    'Settings': 'Mipangilio',
    'KENYA_OVERWATCH': 'KENYA OVERWATCH',
    'COMMAND_CENTER': 'Kituo cha Udhibiti',
    'KENYA_OVERWATCH_SYSTEM': 'MFUMO WA KENYA OVERWATCH',
  },
}

export function t(key: string, lang: Lang = 'en'): string {
  // Fast path for default language to avoid dictionary lookup overhead
  if (lang === 'en') {
    return DICTIONARY.en[key] ?? key
  }
  return DICTIONARY[lang]?.[key] ?? key
}
