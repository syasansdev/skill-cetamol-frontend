export const cleanPhotoUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const filename = url.substring(uploadsIndex + '/uploads/'.length);
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.skillcetamol.online/api';
    const hostBase = apiBase.replace(/\/api\/?$/, '');
    return `${hostBase}/uploads/${filename}`;
  }
  return url;
};
