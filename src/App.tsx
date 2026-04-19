import React, { Suspense, lazy } from "react";
import { useSYNK } from "./lib/Store";
import WelcomeScreen from "./lib/WelcomeScreen";
import { AnimatePresence, motion } from "motion/react";
import AppLayout from "./lib/AppLayout";

function AppContent() {
  const { user, loading, hasProfile } = useSYNK();

  if (loading) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Loading Sync Core...</span>
        </div>
      </div>
    );
  }

  const showWelcome = !user || !hasProfile;

  return (
    <AnimatePresence mode="wait">
      {showWelcome ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[100]"
        >
          <WelcomeScreen />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-screen overflow-hidden"
        >
           <AppLayout />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return <AppContent />;
}
