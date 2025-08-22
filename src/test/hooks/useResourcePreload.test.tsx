import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResourcePreload } from '@/hooks/useResourcePreload';

const triggerLoad = (element: HTMLLinkElement) => {
  setTimeout(() => element.onload && element.onload(new Event('load') as any));
};

describe('useResourcePreload', () => {
  let appendSpy: any;

  beforeEach(() => {
    document.head.innerHTML = '';
    appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el: any) => {
      triggerLoad(el);
      return el;
    });
  });

  afterEach(() => {
    appendSpy.mockRestore();
  });

  it('preloads imagem e atualiza estado', async () => {
    const { result } = renderHook(() => useResourcePreload());
    await act(async () => {
      await result.current.preloadImage('/teste.png');
    });

    expect(appendSpy).toHaveBeenCalled();
    expect(result.current.preloadedResources).toContain('image:/teste.png');
  });

  it('evita preload duplicado', async () => {
    const { result } = renderHook(() => useResourcePreload());
    await act(async () => {
      await result.current.preloadImage('/teste.png');
      await result.current.preloadImage('/teste.png');
    });

    expect(appendSpy).toHaveBeenCalledTimes(1);
  });
});

