import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { auth, db, OperationType, handleFirestoreError } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc } from "firebase/firestore";

export type GoalType = 'pulse' | 'orbit' | 'galaxy';
export type MemberBias = string;

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  completed: boolean;
  createdAt?: any;
}

export interface SyncProfile {
  linkedGroupId: string | null;
  linkedMemberId: string | null;
}

export interface UserStats {
  level: number;
  experience: number;
  crystals: number;
  completed_goals: number;
  currentStreak: number;
  activeMultiplier: number;
  totalPoints: number;
  streakShieldCount: number;
  lastSessionDate?: string;
}

export interface Decoration {
  id: string;
  image: string;
  x: number;
  y: number;
  scale: number;
  type: 'image' | 'crystal' | 'orb';
}

export interface MemoryMedia {
  type: 'image' | 'video';
  url: string;
  duration?: number;
}

export interface Memory {
  id: string;
  uid: string;
  authorUsername?: string;
  authorPhoto?: string;
  caption: string;
  media: MemoryMedia[];
  taggedTaskId?: string;
  taggedTaskTitle?: string;
  createdAt: any;
}

interface SYNKContextType {
  user: User | null;
  loading: boolean;
  stats: UserStats;
  goals: Goal[];
  memories: Memory[];
  addGoal: (title: string, type: GoalType) => Promise<string>;
  completeGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addMemory: (memory: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  completionRate: number;
  triggerAchievement: (title: string, sub: string) => void;
  achievement: { show: boolean, title: string, sub: string };
  hideAchievement: () => void;
  customBackground: string | null;
  setCustomBackground: (url: string | null) => void;
  bias: MemberBias;
  setBias: (bias: MemberBias) => Promise<void>;
  customName: string;
  setCustomName: (name: string) => Promise<void>;
  customPhoto: string | null;
  setCustomPhoto: (url: string | null) => Promise<void>;
  username: string;
  setUsername: (name: string) => Promise<boolean>;
  checkUsername: (name: string) => Promise<boolean>;
  roomAtmosphere: string;
  setRoomAtmosphere: (atmos: string) => Promise<void>;
  directive: string;
  setDirective: (d: string) => Promise<void>;
  frequency: string;
  setFrequency: (f: string) => Promise<void>;
  decorations: Decoration[];
  addDecoration: (image: string, type: 'image' | 'crystal' | 'orb') => void;
  removeDecoration: (id: string) => void;
  syncProfile: (data: any) => Promise<void>;
  hasProfile: boolean;
  resetProfile: () => Promise<void>;
  accentColors: string[];
  setAccentColors: (colors: string[]) => void;
  language: string;
  setLanguage: (lang: string) => void;
  syncProfileData: SyncProfile;
  setSyncProfileData: (data: Partial<SyncProfile>) => Promise<void>;
  completeFocusSession: (minutes: number) => Promise<void>;
}

const SYNKContext = createContext<SYNKContextType | undefined>(undefined);

export function SYNKProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    experience: 0,
    crystals: 10,
    completed_goals: 0,
    currentStreak: 0,
    activeMultiplier: 1,
    totalPoints: 0,
    streakShieldCount: 0,
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [achievement, setAchievement] = useState({ show: false, title: "", sub: "" });
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [bias, setBias] = useState<MemberBias>('None');
  const [customName, setCustomNameState] = useState<string>('');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string>('');
  const lastRemoteName = useRef<string>('');
  const [roomAtmosphere, setRoomAtmosphere] = useState<string>('Standard');
  const [directive, setDirective] = useState<string>('Archiving');
  const [frequency, setFrequency] = useState<string>('Electric');
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [accentColors, setAccentColors] = useState<string[]>(["#60a5fa", "#f472b6", "#a78bfa"]);
  const [language, setLanguageState] = useState<string>(() => localStorage.getItem("synk.language") || "en");
  const [syncProfileData, setSyncProfileDataState] = useState<SyncProfile>({
    linkedGroupId: null,
    linkedMemberId: null
  });

  // Language Persistence
  useEffect(() => {
    localStorage.setItem("synk.language", language);
  }, [language]);

  // Profile Sync
  const syncProfile = useCallback(async (data: any) => {
    if (!auth.currentUser) return;
    if (data.customName) lastRemoteName.current = data.customName;
    console.log("SYNK_PROFILE: Syncing profile data -", data);
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  }, []);

  // Debounce Name Update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && customName && customName !== '' && customName !== lastRemoteName.current) {
         syncProfile({ customName });
         lastRemoteName.current = customName;
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [customName, user, syncProfile]);

  // Auth Listener
  useEffect(() => {
    console.log("SYNK_AUTH: Starting listener...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("SYNK_AUTH: State changed -", currentUser ? "User Logged In" : "No User");
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync Listener
  useEffect(() => {
    if (!user) {
      console.log("SYNK_FIRESTORE: No user, skipping listeners.");
      setGoals([]);
      setLoading(false);
      return;
    }

    console.log("SYNK_FIRESTORE: Initializing listeners for UID:", user.uid);
    const userRef = doc(db, 'users', user.uid);
    const goalsRef = collection(db, 'users', user.uid, 'goals');
    const goalsQuery = query(goalsRef, orderBy('createdAt', 'desc'));

    setLoading(true);

    const unsubUser = onSnapshot(userRef, (docSnap) => {
      console.log("SYNK_FIRESTORE: User document update received.");
      if (docSnap.exists()) {
        const data = docSnap.data();
        const incomingStats = data.stats || {};
        setStats({
          level: incomingStats.level ?? 1,
          experience: incomingStats.experience ?? 0,
          crystals: incomingStats.crystals ?? 10,
          completed_goals: incomingStats.completed_goals ?? 0,
          currentStreak: incomingStats.currentStreak ?? 0,
          activeMultiplier: incomingStats.activeMultiplier ?? 1.0,
          totalPoints: incomingStats.totalPoints ?? 0,
          streakShieldCount: incomingStats.streakShieldCount ?? 0,
          lastSessionDate: incomingStats.lastSessionDate
        } as UserStats);
        setBias(data.bias || 'None');
        
        // Dynamic Sync Profile
        if (data.syncProfile) {
          setSyncProfileDataState(data.syncProfile);
        }

        if (data.customName !== undefined) {
          lastRemoteName.current = data.customName;
          setCustomNameState(data.customName);
        }
        if (data.username !== undefined) {
          setUsernameState(data.username);
        }
        setCustomPhoto(data.customPhoto || null);
        setCustomBackground(data.customBackground || null);
        setRoomAtmosphere(data.roomAtmosphere || 'Standard');
        setDirective(data.directive || 'Dashboard');
        setFrequency(data.frequency || 'Electric');
        setHasProfile(true);
      } else {
        console.log("SYNK_FIRESTORE: User profile document does not exist yet.");
        setHasProfile(false);
      }
      setLoading(false);
    }, (e) => {
      console.error("SYNK_FIRESTORE: Error in user snapshot -", e);
      setLoading(false);
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
    });

    const unsubGoals = onSnapshot(goalsQuery, (querySnap) => {
      const g = querySnap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
      setGoals(g);
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}/goals`));

    const memoriesRef = collection(db, 'users', user.uid, 'memories');
    const memoriesQuery = query(memoriesRef, orderBy('createdAt', 'desc'));
    const unsubMemories = onSnapshot(memoriesQuery, (querySnap) => {
      const m = querySnap.docs.map(d => ({ id: d.id, ...d.data() } as Memory));
      setMemories(m);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/memories`));

    return () => {
      unsubUser();
      unsubGoals();
      unsubMemories();
    };
  }, [user]);

  const addGoal = async (title: string, type: GoalType) => {
    if (!user) return "";
    const goalsRef = collection(db, 'users', user.uid, 'goals');
    try {
      const docRef = await addDoc(goalsRef, {
        uid: user.uid,
        title,
        type,
        completed: false,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/goals`);
      return "";
    }
  };

  const completeGoal = async (id: string) => {
    if (!user) return;
    const goalRef = doc(db, 'users', user.uid, 'goals', id);
    const goalSnap = await getDoc(goalRef);
    
    if (goalSnap.exists() && !goalSnap.data().completed) {
      try {
        await updateDoc(goalRef, { completed: true });
        
        // Update stats in user document
        const userRef = doc(db, 'users', user.uid);
        const newExp = stats.experience + 50;
        const newLevel = Math.floor(newExp / 200) + 1;
        
        if (newLevel > stats.level) {
          triggerAchievement("等級提升", `已達到共鳴等級 ${newLevel}`);
        } else {
          triggerAchievement("目標達成", "+50 EXP | +5 水晶");
        }

        await updateDoc(userRef, {
          "stats.experience": newExp,
          "stats.level": newLevel,
          "stats.crystals": stats.crystals + 5,
          "stats.completed_goals": stats.completed_goals + 1,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/goals/${id}`);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const goalRef = doc(db, 'users', user.uid, 'goals', id);
    try {
      await deleteDoc(goalRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/goals/${id}`);
    }
  };

  const checkUsername = async (name: string): Promise<boolean> => {
    if (!name || name.length < 3) return false;
    const cleanName = name.toLowerCase().trim();
    const nameRef = doc(db, 'usernames', cleanName);
    try {
      const snap = await getDoc(nameRef);
      if (!snap.exists()) return true;
      // If it exists, check if it's owned by the current user
      return snap.data().uid === user?.uid;
    } catch (e) {
      console.error("Username check failed", e);
      return false;
    }
  };

  const setUsername = async (name: string): Promise<boolean> => {
    if (!user) return false;
    const cleanName = name.trim();
    const lowerName = cleanName.toLowerCase();
    
    // 1. Check if available
    const available = await checkUsername(lowerName);
    if (!available) return false;

    try {
      // 2. Clear old username if exists
      if (username && username.toLowerCase() !== lowerName) {
        await deleteDoc(doc(db, 'usernames', username.toLowerCase()));
      }

      // 3. Claim new username
      await setDoc(doc(db, 'usernames', lowerName), {
        uid: user.uid,
        username: cleanName,
        updatedAt: serverTimestamp()
      });

      // 4. Update user profile
      await syncProfile({ username: cleanName });
      setUsernameState(cleanName);
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `usernames/${lowerName}`);
      return false;
    }
  };

  const addMemory = async (memoryData: Partial<Memory>) => {
    if (!user) return;
    const memoriesRef = collection(db, 'users', user.uid, 'memories');
    
    // Scrub undefined values to prevent Firestore errors
    const scrubbedData = Object.fromEntries(
      Object.entries(memoryData).filter(([_, v]) => v !== undefined)
    );

    try {
      await addDoc(memoriesRef, {
        uid: user.uid,
        authorUsername: username || customName || "GUEST",
        authorPhoto: customPhoto || user.photoURL || null,
        ...scrubbedData,
        createdAt: serverTimestamp()
      });
      triggerAchievement("記憶同步完成", "共鳴影像已上傳至 Oracle 頻道");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/memories`);
    }
  };

  const deleteMemory = async (id: string) => {
    if (!user) return;
    const memoryRef = doc(db, 'users', user.uid, 'memories', id);
    try {
      await deleteDoc(memoryRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/memories/${id}`);
    }
  };

  const triggerAchievement = (title: string, sub: string) => {
    setAchievement({ show: true, title, sub });
    setTimeout(() => {
      setAchievement(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const hideAchievement = () => setAchievement(prev => ({...prev, show: false}));

  const calculateMultiplier = (streak: number) => {
    if (streak <= 2) return 1.0;
    if (streak <= 6) return 1.2;
    if (streak <= 13) return 1.5;
    if (streak <= 20) return 1.8;
    if (streak <= 27) return 2.1;
    return 2.5; 
  };

  const completeFocusSession = async (minutes: number) => {
    if (!user) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const currentStats = { ...stats };
    let newStreak = (currentStats as any).currentStreak || 0;
    let newShields = (currentStats as any).streakShieldCount || 0;

    if (currentStats.lastSessionDate !== todayStr) {
      if (currentStats.lastSessionDate === yesterdayStr) {
        newStreak += 1;
      } else if (!currentStats.lastSessionDate) {
        newStreak = 1;
      } else {
        const lastDate = new Date(currentStats.lastSessionDate);
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const missedDays = diffDays - 1;

        if (missedDays > 0 && newShields >= missedDays) {
          newShields -= missedDays;
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }

    const newMultiplier = calculateMultiplier(newStreak);
    const baseExp = minutes * 2;
    const basePoints = minutes * 10;
    const earnedPoints = Math.floor(basePoints * newMultiplier);
    const earnedExp = Math.floor(baseExp * newMultiplier);

    const newExp = currentStats.experience + earnedExp;
    const newLevel = Math.floor(newExp / 200) + 1;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedStats = {
        ...currentStats,
        experience: newExp,
        level: newLevel,
        currentStreak: newStreak,
        activeMultiplier: newMultiplier,
        totalPoints: ((currentStats as any).totalPoints || 0) + earnedPoints,
        streakShieldCount: newShields,
        lastSessionDate: todayStr
      };

      await updateDoc(userRef, {
        stats: updatedStats,
        updatedAt: serverTimestamp()
      });

      if (newLevel > currentStats.level) {
        triggerAchievement("境界突破", `已達到共鳴等級 ${newLevel}`);
      } else {
        triggerAchievement("同步成功", `+${earnedPoints} 點數 | ${newMultiplier}x 加成`);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addDecoration = (image: string, type: 'image' | 'crystal' | 'orb') => {
    const newDeco: Decoration = {
      id: Math.random().toString(),
      image,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      scale: 0.8 + Math.random() * 0.4,
      type
    };
    setDecorations([...decorations, newDeco]);
    triggerAchievement("具現完成", "新遺物已同步到您的房間");
  };

  const removeDecoration = (id: string) => {
    setDecorations(decorations.filter(d => d.id !== id));
  };

  const resetProfile = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await deleteDoc(userRef);
      setHasProfile(false);
      // Optional: Clear other local states if needed, though being caught by listener will handle most
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const setSyncProfileData = useCallback(async (data: Partial<SyncProfile>) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        "syncProfile": {
          ...syncProfileData,
          ...data
        },
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  }, [syncProfileData]);

  const totalCompleted = goals.filter(g => g.completed).length;
  const completionRate = goals.length === 0 ? 0 : totalCompleted / goals.length;

  return (
    <SYNKContext.Provider value={{
      user, loading, stats, goals, memories, addGoal, completeGoal, deleteGoal,
      addMemory, deleteMemory, completionRate,
      triggerAchievement, achievement, hideAchievement,
      customBackground, setCustomBackground: async (url: string | null) => {
        if (url === customBackground) return;
        setCustomBackground(url);
        await syncProfile({ customBackground: url });
      },
      bias, setBias: async (b: MemberBias) => {
        if (b === bias) return;
        await syncProfile({ bias: b });
      },
      customName, setCustomName: async (name: string) => {
        if (name === customName) return;
        setCustomNameState(name);
      },
      username, setUsername, checkUsername,
      customPhoto, setCustomPhoto: async (url: string | null) => {
        if (url === customPhoto) return;
        await syncProfile({ customPhoto: url });
      },
      roomAtmosphere, setRoomAtmosphere: async (a: string) => {
        if (a === roomAtmosphere) return;
        await syncProfile({ roomAtmosphere: a });
      },
      directive, setDirective: async (d: string) => {
        if (d === directive) return;
        await syncProfile({ directive: d });
      },
      frequency, setFrequency: async (f: string) => {
        if (f === frequency) return;
        await syncProfile({ frequency: f });
      },
      decorations, addDecoration, removeDecoration,
      syncProfile,
      hasProfile,
      resetProfile,
      accentColors,
      setAccentColors,
      language,
      setLanguage: setLanguageState,
      syncProfileData,
      setSyncProfileData,
      completeFocusSession
    }}>
      {children}
    </SYNKContext.Provider>
  );
}

export function useSYNK() {
  const context = useContext(SYNKContext);
  if (!context) throw new Error("useSYNK must be used within SYNKProvider");
  return context;
}
