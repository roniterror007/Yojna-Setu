import schemesData from '../data/schemes.json';

export const allSchemes = schemesData.schemes;

export function getSchemeSummaryForAI() {
  return allSchemes.map(s => ({
    id: s.id,
    name: s.name,
    fullName: s.fullName,
    category: s.category,
    benefit: s.benefit,
    eligibility: s.eligibility,
    tags: s.tags,
  }));
}

export function getSchemeById(id) {
  return allSchemes.find(s => s.id === id);
}

export function getSchemesByIds(ids) {
  return ids.map(id => allSchemes.find(s => s.id === id)).filter(Boolean);
}

export function getSchemeTranslation(scheme, langCode) {
  const trans = scheme.translations?.[langCode];
  if (!trans) return null;
  return {
    ...scheme,
    name: trans.name || scheme.name,
    description: trans.description || scheme.benefit.description,
    eligibilityText: trans.eligibility || JSON.stringify(scheme.eligibility),
    howToApplyText: trans.howToApply || scheme.howToApply,
  };
}
