import { useSYNK } from "./Store";
import { useFandom } from "./FandomContext";
import { motion, AnimatePresence } from "motion/react";
import { lazy, Suspense, useState } from "react";
import { Home, Vault, Zap, Fingerprint, Gem, Database } from "lucide-react";
import { cn } from "./utils";
import { translations, Language } from "./translations";

// Lazy load tabs
const RitualDashboard = lazy(() => import("./tabs/RitualDashboard"));
const GoalVault = lazy(() => import("./tabs/GoalVault"));
const SynkOracle = lazy(() => import("./tabs/SynkOracle"));
const IdentityCard = lazy(() => import("./tabs/IdentityCard"));
const FandomRegistry = lazy(() => import("./tabs/FandomRegistry"));

const TABS = (t: any, fandom: any) => [
  { id: "agenda", label: fandom.terminology.homeHeader || t.common.home, subLabel: "AGENDA", icon: Home },
  { id: "journal", label: fandom.terminology.taskLabel || t.common.directives, subLabel: "JOURNAL", icon: Vault },
  { id: "proof", label: fandom.terminology.galleryLabel || t.common.oracle, subLabel: "MEDIA", icon: Gem },
  { id: "identity", label: t.common.identity, subLabel: "PROFILE", icon: Fingerprint },
  { id: "registry", label: "Registry", subLabel: "DATABASE", icon: Database },
] as const;

type TabId = "agenda" | "journal" | "proof" | "identity" | "registry";

export default function AppLayout() {
  const { stats, achievement, language } = useSYNK();
  const { activeConfig } = useFandom();
  const [activeTab, setActiveTab] = useState<TabId>("agenda");
  const [direction, setDirection] = useState(0);

  const t = translations[language as Language] || translations.en;
  const currentTabs = TABS(t, activeConfig);

  const handleNav = (id: TabId) => {
    if (id === activeTab) return;
    const currentIndex = currentTabs.findIndex(t => t.id === activeTab);
    const nextIndex = currentTabs.findIndex(t => t.id === id);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(id);
  };

  return (
    <div 
      className="relative w-full h-screen bg-synk-bg text-synk-foreground overflow-hidden flex font-sans"
      style={{ '--primary-color': activeConfig.theme.primaryColor } as any}
    >
      <div className="flex w-full h-full max-w-[1440px] mx-auto bg-white border-x border-synk-border overflow-hidden">
        
        {/* Sidebar - Left Navigation */}
        <aside className="hidden lg:flex w-[260px] flex-col pt-7 px-10 pb-10 border-r border-synk-border bg-white flex-shrink-0">
          <div className="text-4xl font-black tracking-[0.05em] mb-14 text-synk-foreground group select-none">
            <span>SYNK.</span>
          </div>
          <nav className="flex flex-col gap-8">
            {currentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNav(tab.id)}
                  className={cn(
                    "flex items-center gap-5 text-lg font-bold transition-all group relative",
                    isActive ? "text-black" : "text-zinc-300 hover:text-zinc-500"
                  )}
                >
                  <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive ? "text-black stroke-[2.5px]" : "text-zinc-300 stroke-2")} />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[14px] uppercase tracking-tighter font-black">{tab.label}</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-300 group-hover:text-zinc-400 transition-colors mt-1">{tab.subLabel}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActive"
                      className="absolute -left-6 w-1.5 h-6 bg-black rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Feed Content - Center */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Mobile Header */}
          <header className="lg:hidden h-20 flex items-center justify-between px-8 border-b border-synk-border flex-shrink-0">
            <div className="text-3xl font-black tracking-tighter text-synk-foreground">SYNK.</div>
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold">
              <Zap className="w-3 h-3 text-black" />
              {stats.crystals}
            </div>
          </header>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={{
                  initial: (direction: number) => ({
                    opacity: 0,
                    x: direction > 0 ? 30 : -30,
                  }),
                  animate: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
                  },
                  exit: (direction: number) => ({
                    opacity: 0,
                    x: direction > 0 ? -30 : 30,
                    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
                  })
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full"
              >
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xs text-zinc-300 font-medium">Loading...</div>}>
                  {activeTab === "agenda" && <RitualDashboard />}
                  {activeTab === "journal" && <GoalVault />}
                  {activeTab === "proof" && <SynkOracle />}
                  {activeTab === "identity" && <IdentityCard />}
                  {activeTab === "registry" && <FandomRegistry />}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Tab Bar */}
          <nav className="lg:hidden h-24 border-t border-synk-border flex items-center justify-around px-6 pb-safe flex-shrink-0 bg-white/80 backdrop-blur-md">
            {currentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNav(tab.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-16 h-full transition-all active:scale-90",
                    isActive ? "text-black" : "text-zinc-200 hover:text-zinc-400"
                  )}
                >
                  <Icon className={cn("w-7 h-7 mb-1", isActive ? "stroke-2.5" : "stroke-2")} />
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", isActive ? "opacity-100" : "opacity-0")}>
                    {tab.subLabel}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabDot"
                      className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-black"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </main>

        {/* Right Sidebar - Stats & Info */}
        <aside className="hidden xl:flex w-[280px] flex-col p-6 border-l border-synk-border bg-white flex-shrink-0 gap-6">
          <div className="bg-zinc-100 p-3 rounded-full text-zinc-500 text-sm flex items-center gap-2">
            {t.common.search}
          </div>

          <div className="bg-zinc-50 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-zinc-400">{t.common.matrix}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">{t.common.level}</span>
                <span className="text-xl font-bold">{stats.level}</span>
              </div>
              <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-500" 
                  style={{ width: `${(stats.experience % 100)}%` }} 
                />
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">{t.common.crystals}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-lg font-bold">{stats.crystals}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">{t.vault.title} {t.common.done}</span>
                  <span className="text-lg font-bold mt-1">{stats.completed_goals}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-synk-border text-[10px] text-zinc-300 font-bold uppercase tracking-widest text-center">
            {t.common.concept} v1.0.4
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {achievement.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-black text-white shadow-xl flex items-center gap-3"
          >
            <Home className="w-4 h-4 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{achievement.title}</span>
              <span className="text-[8px] text-zinc-400 uppercase tracking-widest mt-1">{achievement.sub}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

