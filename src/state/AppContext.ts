import { createContext, useContext } from 'react';
import type { User } from '../models';

type AppContextValue = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshKey: number;
  refresh: () => void;
};

export const AppContext = createContext<AppContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  refreshKey: 0,
  refresh: () => {},
});

export function useApp() {
  return useContext(AppContext);
}
