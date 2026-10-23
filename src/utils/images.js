// src/utils/images.js

export const DEFAULT_LISTING_IMAGE =
  'https://res.cloudinary.com/diusdzo3p/image/upload/v1715544415/default-property_fzv3v2.jpg';

/**
 * Extrait une URL brute depuis une chaîne, un objet Cloudinary ou un objet fichier.
 */
const getCandidateUrl = (imagePath) => {
  if (!imagePath) return '';

  if (typeof imagePath === 'object') {
    return (
      imagePath.secure_url ||
      imagePath.url ||
      imagePath.path ||
      imagePath.filename ||
      ''
    );
  }

  return String(imagePath).trim();
};

/**
 * Résout l'URL complète d'une image avec repli par défaut.
 */
export const getImageUrl = (imagePath) => {
  const path = getCandidateUrl(imagePath);
  if (!path) return DEFAULT_LISTING_IMAGE;

  // URLs absolues, Blob URLs (preview locale) ou Data Base64
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    // Sécurité HTTPS pour Cloudinary
    return path.replace(/^http:\/\//i, 'https://');
  }

  // Fallback serveur local pour les anciens enregistrements
  // NOTE: VITE_BACKEND_URL must be set in .env for production deployments,
  // otherwise locally-uploaded images will try to load from localhost.
  const backendBase = (
    import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
  ).replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');

  return `${backendBase}/uploads/${cleanPath}`;
};

/**
 * Extrait l'image principale d'une annonce (Listing / Property).
 */
export const getListingImage = (listing) => {
  if (!listing) return DEFAULT_LISTING_IMAGE;

  // Support des tableaux d'images ou d'une image de couverture unique
  const images = listing.images || listing.photos;

  if (Array.isArray(images) && images.length > 0) {
    return getImageUrl(images[0]);
  }

  if (listing.coverImage || listing.image) {
    return getImageUrl(listing.coverImage || listing.image);
  }

  return DEFAULT_LISTING_IMAGE;
};