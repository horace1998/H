import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
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
    customImage?: string;
  }[];
  assets: {
    passportProfile: string;
    passportTexture: string;
    customPassportProfile?: string;
  };
}

const DEFAULT_CONFIGS: Record<string, FandomConfig> = (fandomData as FandomConfig[]).reduce((acc, config) => {
  acc[config.groupId] = config;
  return acc;
}, {} as Record<string, FandomConfig>);

interface FandomContextType {
  activeConfig: FandomConfig;
  switchFandom: (groupId: string) => void;
  fandoms: FandomConfig[];
  loading: boolean;
}

const FandomContext = createContext<FandomContextType | undefined>(undefined);

export function FandomProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<Record<string, FandomConfig>>(DEFAULT_CONFIGS);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    return localStorage.getItem("synk.activeFandom") || "aespa";
  });

  useEffect(() => {
    const q = query(collection(db, "fandom_registry"), orderBy("groupId", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbConfigs: Record<string, FandomConfig> = { ...DEFAULT_CONFIGS };
      snapshot.forEach((doc) => {
        dbConfigs[doc.id] = doc.data() as FandomConfig;
      });
      setConfigs(dbConfigs);
      setLoading(false);
    }, (error) => {
      console.error("Fandom Registry Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeConfig = configs[activeGroupId] || configs.aespa;

  const switchFandom = useCallback((groupId: string) => {
    if (configs[groupId]) {
      setActiveGroupId(groupId);
      localStorage.setItem("synk.activeFandom", groupId);
    }
  }, [configs]);

  const fandoms = Object.values(configs);

  return (
    <FandomContext.Provider value={{ activeConfig, switchFandom, fandoms, loading }}>
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
