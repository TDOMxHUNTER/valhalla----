import React, { createContext, useContext } from 'react';

// Simple context for Discord verification state
interface AppContextType {
  discordVerified: boolean;
  setDiscordVerified: (verified: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [discordVerified, setDiscordVerified] = React.useState(false);

  return (
    <AppContext.Provider value={{ discordVerified, setDiscordVerified }}>
      {children}
    </AppContext.Provider>
  );
}