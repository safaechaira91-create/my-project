/**
 * تنسيق وتطهير النصوص (String Sanitization)
 */
export const sanitizeText = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[\n\r]+/g, ' ');
};

/**
 * حساب إجمالي السعر شاملاً الضرائب ورسوم الخدمة
 */
export const calculateTotalAmount = (nightlyPrice, nights, serviceFeePercent = 10) => {
  const base = Number(nightlyPrice || 0) * Math.max(1, Number(nights || 1));
  const fee = (base * serviceFeePercent) / 100;
  return Math.round((base + fee) * 100) / 100;
};

/**
 * إنشاء رمز عشوائي مميز (للتفعيل، إعادة التعيين، أو المراجع)
 */
export const generateUniqueToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * التحقق من صحة معرّف Mongo ObjectId
 */
export const isValidObjectId = (id) => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

/**
 * اقتطاع النص الطويل مع إدراج نقاط (...)
 */
export const truncateString = (str, num = 100) => {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
};