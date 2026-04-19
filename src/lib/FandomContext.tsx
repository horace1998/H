import { createContext, useContext, useState, ReactNode, useCallback } from "react";

import fandomData from "./fandoms.json";

export interface FandomConfig {
  groupId: string;
  meta: {
    displayName: string;
    fandomName: string;
  };
  terminology: {
    homeHeader: string;
    taskLabel: string;
    galleryLabel: string;
    idLabel: string;
    actionButton: string;
  };
  theme: {
    primaryColor: string;
    variant: string;
  };
  members: {
    id: string;
    name: string;
    role?: string;
  }[];
  assets: {
    passportProfile: string;
    passportTexture: string;
  };
}

export const FANDOM_CONFIGS: Record<string, FandomConfig> = (fandomData as FandomConfig[]).reduce((acc, config) => {
  acc[config.groupId] = config;
  return acc;
}, {} as Record<string, FandomConfig>);

interface FandomContextType {
  activeConfig: FandomConfig;
  switchFandom: (groupId: string) => void;
  fandoms: FandomConfig[];
}

const FandomContext = createContext<FandomContextType | undefined>(undefined);

export function FandomProvider({ children }: { children: ReactNode }) {
  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    return localStorage.getItem("synk.activeFandom") || "aespa";
  });

  const activeConfig = FANDOM_CONFIGS[activeGroupId] || FANDOM_CONFIGS.aespa;

  const switchFandom = useCallback((groupId: string) => {
    if (FANDOM_CONFIGS[groupId]) {
      setActiveGroupId(groupId);
      localStorage.setItem("synk.activeFandom", groupId);
    }
  }, []);

  const fandoms = Object.values(FANDOM_CONFIGS);

  return (
    <FandomContext.Provider value={{ activeConfig, switchFandom, fandoms }}>
      {children}
    </FandomContext.Provider>
  );
}

export function useFandom() {
  const context = useContext(FandomContext);
  if (!context) {
    throw new Error("useFandom must be used within a FandomProvider");
  }
  return context;
}
