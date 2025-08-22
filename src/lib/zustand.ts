import { useSyncExternalStore } from 'react';

export type StateCreator<T> = (
  set: (partial: Partial<T>) => void,
  get: () => T
) => T;

export function create<T>(initializer: StateCreator<T>) {
  let state: T;
  const listeners = new Set<() => void>();

  const setState = (partial: Partial<T>) => {
    state = { ...state, ...partial };
    listeners.forEach(l => l());
  };

  const getState = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  return function useStore(): T {
    return useSyncExternalStore(subscribe, getState, getState);
  };
}
