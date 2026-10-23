/**
 * Normalise un texte en arabe pour faciliter les recherches et comparaisons.
 * - Supprime les diacritiques (التشكيل) et le Tatweel (ـ)
 * - Harmonise les formes de Hamza (أ, إ, آ -> ا)
 * - Harmonise Alef Maqsura et Yaa (ى -> ي) et Ta Marbouta (ة -> ه)
 */
export const normalizeArabic = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .trim()
    .toLowerCase()
    // Supprimer les diacritiques (Tashkeel)
    .replace(/[\u064B-\u0652]/g, '')
    // Supprimer Tatweel (Kashida)
    .replace(/\u0640/g, '')
    // Normaliser les différentes formes d'Alef
    .replace(/[أإآ]/g, 'ا')
    // Normaliser Alef Maqsura vers Yaa
    .replace(/ى/g, 'ي')
    // Normaliser Ta Marbouta vers Ha
    .replace(/ة/g, 'ه')
    // Nettoyer les espaces multiples
    .replace(/\s+/g, ' ');
};