import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminProvider, useAdmin } from '@/admin/context/AdminProvider';
import { totp } from 'otplib';

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();

const selectQuery: any = {
  eq: vi.fn(),
  single: vi.fn(),
};
selectQuery.eq.mockReturnValue(selectQuery);

const updateEq = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn(() => ({ eq: updateEq }));

const fromMock = vi.fn(() => ({
  select: vi.fn().mockReturnValue(selectQuery),
  update: updateMock,
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { signInWithPassword, signOut, getSession, onAuthStateChange },
    from: fromMock,
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AdminProvider>{children}</AdminProvider>
);

describe('AdminProvider TOTP verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
    signInWithPassword.mockReset();
    signOut.mockReset();
    getSession.mockResolvedValue({ data: { session: null } });
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    selectQuery.eq.mockClear();
    selectQuery.single.mockReset();
    fromMock.mockClear();
    updateMock.mockClear();
    updateEq.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a valid TOTP code', async () => {
    const adminUser = {
      id: '1',
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'admin',
      is_active: true,
      two_factor_enabled: true,
      two_factor_secret: secret,
      created_at: '',
      updated_at: '',
    };
    selectQuery.single.mockResolvedValue({ data: adminUser, error: null });
    signInWithPassword.mockResolvedValue({
      data: {
        session: { user: { email: 'admin@example.com' }, expires_at: Math.floor(Date.now() / 1000) + 3600 },
        user: { email: 'admin@example.com' },
      },
      error: null,
    });

    const token = totp.generate(secret);

    const { result } = renderHook(() => useAdmin(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.login('admin@example.com', 'password', token);
    });

    expect(response).toEqual({ success: true });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('rejects an invalid TOTP code', async () => {
    const adminUser = {
      id: '1',
      email: 'admin@example.com',
      full_name: 'Admin',
      role: 'admin',
      is_active: true,
      two_factor_enabled: true,
      two_factor_secret: secret,
      created_at: '',
      updated_at: '',
    };
    selectQuery.single.mockResolvedValue({ data: adminUser, error: null });
    signInWithPassword.mockResolvedValue({
      data: {
        session: { user: { email: 'admin@example.com' }, expires_at: Math.floor(Date.now() / 1000) + 3600 },
        user: { email: 'admin@example.com' },
      },
      error: null,
    });

    const { result } = renderHook(() => useAdmin(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.login('admin@example.com', 'password', '123456');
    });

    expect(response).toEqual({ success: false, error: 'Código 2FA inválido' });
    expect(signOut).toHaveBeenCalled();
  });
});
