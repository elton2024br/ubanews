import DOMPurify from 'dompurify';

export const sanitizeHtml = (content: string): string => {
  return DOMPurify.sanitize(content);
};

export const sanitizeText = (content: string): string => {
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export default { sanitizeHtml, sanitizeText };
