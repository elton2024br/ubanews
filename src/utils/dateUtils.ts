/**
 * Utilitários para formatação de datas
 */

/**
 * Formata uma data para o formato brasileiro (dd/mm/aaaa)
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formata uma data para o formato brasileiro com hora (dd/mm/aaaa às HH:mm)
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata uma data de forma relativa (há X dias, há X horas, etc.)
 */
export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'Agora mesmo' : `Há ${diffInMinutes} minutos`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? 'Há 1 hora' : `Há ${diffInHours} horas`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? 'Há 1 dia' : `Há ${diffInDays} dias`;
  } else {
    return formatDate(dateObj);
  }
};

/**
 * Formata uma data para o formato de mês e ano (Janeiro 2024)
 */
export const formatMonthYear = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Verifica se uma data é hoje
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Verifica se uma data é desta semana
 */
export const isThisWeek = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return dateObj >= weekAgo && dateObj <= now;
};