export const getErrorMessage = (error, fallback = 'حدث خطأ غير متوقع') => {
  const data = error?.response?.data;

  // 1. Si le backend renvoie directement une chaîne
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  // 2. Si le backend renvoie un tableau d'erreurs de validation (ex: express-validator)
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const firstError = data.errors[0];
    return typeof firstError === 'string' ? firstError : firstError.msg || firstError.message || fallback;
  }

  // 3. Message d'erreur personnalisé du backend ({ message: "..." })
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }

  // 4. Erreurs réseau spécifiques Axios
  if (error?.code === 'ERR_NETWORK') {
    return 'تعذر الاتصال بالسيرفر، يرجى التحقق من الاتصال بالإنترنت';
  }

  // 5. Message générique Axios / JavaScript
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
};