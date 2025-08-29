// Utilitário para proteção CSRF (Cross-Site Request Forgery)
// Gera e valida tokens CSRF para formulários críticos

import { v4 as uuidv4 } from 'uuid';

// Chave para armazenar o token CSRF no sessionStorage
const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';

// Tempo de expiração do token (30 minutos)
const TOKEN_EXPIRY_TIME = 30 * 60 * 1000;

/**
 * Gera um novo token CSRF e o armazena no sessionStorage
 * @returns string - O token CSRF gerado
 */
export function generateCSRFToken(): string {
  const token = uuidv4();
  const expiry = Date.now() + TOKEN_EXPIRY_TIME;
  
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, expiry.toString());
  
  return token;
}

/**
 * Obtém o token CSRF atual do sessionStorage
 * @returns string | null - O token CSRF ou null se não existir/expirado
 */
export function getCSRFToken(): string | null {
  const token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiryStr = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryStr) {
    return null;
  }
  
  const expiry = parseInt(expiryStr, 10);
  if (Date.now() > expiry) {
    // Token expirado, remover do storage
    clearCSRFToken();
    return null;
  }
  
  return token;
}

/**
 * Valida se o token CSRF fornecido é válido
 * @param token - Token a ser validado
 * @returns boolean - true se válido, false caso contrário
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
}

/**
 * Remove o token CSRF do sessionStorage
 */
export function clearCSRFToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
}

/**
 * Hook personalizado para gerenciar tokens CSRF em componentes React
 * @returns objeto com funções para gerenciar CSRF
 */
export function useCSRF() {
  const getToken = (): string => {
    let token = getCSRFToken();
    if (!token) {
      token = generateCSRFToken();
    }
    return token;
  };
  
  const validateToken = (token: string): boolean => {
    return validateCSRFToken(token);
  };
  
  const refreshToken = (): string => {
    clearCSRFToken();
    return generateCSRFToken();
  };
  
  return {
    getToken,
    validateToken,
    refreshToken,
    clearToken: clearCSRFToken
  };
}

/**
 * Adiciona o token CSRF aos headers de uma requisição
 * @param headers - Headers existentes
 * @returns Headers com o token CSRF adicionado
 */
export function addCSRFHeader(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }
  return headers;
}

/**
 * Middleware para validar token CSRF em requisições
 * @param token - Token recebido na requisição
 * @throws Error se o token for inválido
 */
export function validateCSRFMiddleware(token: string | undefined): void {
  if (!token) {
    throw new Error('Token CSRF não fornecido');
  }
  
  if (!validateCSRFToken(token)) {
    throw new Error('Token CSRF inválido ou expirado');
  }
}