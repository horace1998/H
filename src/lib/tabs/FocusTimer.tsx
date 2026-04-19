import React, { useState, useEffect, useRef } from "react";
import { useSYNK } from "../Store";
import { useFandom } from "../FandomContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Minus,
  Plus,
  Play, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Flame, 
  Timer as TimerIcon,
  Sparkles
} from "lucide-react";
import { cn } from "../utils";

export default function FocusTimer() {
  const { stats, completeFocusSession, triggerAchievement, customBackground } = useSYNK();
  const { activeConfig } = useFandom();

  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(25); // minutes
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeRef = useRef(0);

  // Cheat Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        handleFail();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  const handleStart = () => {
    const seconds = duration * 60;
    setTimeLeft(seconds);
    initialTimeRef.current = seconds;
    setIsActive(true);
    setFailed(false);
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTimeLeft(0);
  };

  const handleFail = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTimeLeft(0);
    setFailed(true);
    triggerAchievement("同步中斷", "檢測到外部干擾，連線已失敗");
  };

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    completeFocusSession(duration);
    setTimeLeft(0);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = timeLeft > 0 ? (timeLeft / (duration * 60)) * 100 : 0;

  // Multiplier Progress Logic
  const getNextTier = (streak: number) => {
    if (streak < 3) return 3;
    if (streak < 7) return 7;
    if (streak < 14) return 14;
    if (streak < 21) return 21;
    if (streak < 28) return 28;
    return 30;
  };

  const nextTier = getNextTier(stats.currentStreak);
  const prevTier = stats.currentStreak >= 28 ? 28 : (stats.currentStreak >= 21 ? 21 : (stats.currentStreak >= 14 ? 14 : (stats.currentStreak >= 7 ? 7 : (stats.currentStreak >= 3 ? 3 : 0))));
  const resonanceProgress = ((stats.currentStreak - prevTier) / (nextTier - prevTier)) * 100;

  return (
    <div className="w-full h-full flex flex-col p-6 lg:p-10 pb-32 overflow-y-auto custom-scrollbar overflow-x-hidden bg-white text-zinc-900">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-10">
        
        {/* Minimalist Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-100 pb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tighter uppercase">Focus Session</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-zinc-400">Deep state synchronization</p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none mb-1">Status</span>
              <span className={cn(
                "text-2xl font-black tracking-tighter",
                isActive ? "text-purple-600 animate-pulse" : "text-zinc-900"
              )}>
                {isActive ? "RESONATING" : "STANDBY"}
              </span>
            </div>
          </div>
        </header>

        {/* Sync Status Multiplier Panel */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cn(
            "p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-6 overflow-hidden relative",
            isActive 
              ? "bg-purple-50/50 border-purple-100 shadow-xl shadow-purple-500/5" 
              : "bg-zinc-50/50 border-zinc-100 shadow-sm"
          )}>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Sync Multiplier</p>
                <div className="flex items-end gap-1">
                  <span className={cn(
                    "text-5xl font-black tracking-tighter",
                    isActive ? "text-purple-600" : "text-zinc-900"
                  )}>
                    {(stats.activeMultiplier || 1.0).toFixed(1)}x
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-inner",
                isActive ? "bg-purple-600 border-purple-400 text-white shadow-purple-900/20" : "bg-white border-zinc-100 text-zinc-300"
              )}>
                <Zap className={cn("w-7 h-7", isActive ? "fill-current" : "")} />
              </div>
            </div>
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                <span>Resonance Level</span>
                <span className="text-zinc-900 font-black">Tier {nextTier}</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${resonanceProgress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            {isActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.1),transparent_70%)] pointer-events-none" 
              />
            )}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Current Streak</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                    <Flame className={cn("w-6 h-6", stats.currentStreak > 0 ? "text-orange-500 fill-orange-500/20" : "text-zinc-200")} />
                  </div>
                  <span className="text-4xl font-black tracking-tighter text-zinc-900">
                    {stats.currentStreak} <span className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-widest">Days</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Shields</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-zinc-900">{stats.streakShieldCount}</span>
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                    <Shield className={cn("w-5 h-5", stats.streakShieldCount > 0 ? "text-blue-400 fill-blue-400/10" : "text-zinc-200")} />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.15em] leading-relaxed mt-6">
              RESONANCE SHIELDS PREVENT STREAK RESET FROM INACTIVITY.
            </p>
          </div>
        </section>

        {/* Main Timer Area */}
        <section className="flex-1 flex flex-col items-center justify-center py-12 min-h-[500px]">
          <AnimatePresence mode="wait">
            {!isActive ? (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-14 w-full"
              >
                <div className="relative group">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -inset-16 bg-purple-500 rounded-full blur-[80px]" 
                  />
                  <div className="relative w-80 h-80 rounded-full border-[1.5px] border-zinc-100 flex flex-col items-center justify-center bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.03),transparent_70%)]" />
                    
                    <div className="flex flex-col items-center z-10">
                      <div className="flex items-center gap-4 mb-2">
                        <button 
                          onClick={() => setDuration(prev => Math.max(1, prev - 1))}
                          className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors bg-white shadow-sm"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-8xl font-black tracking-tighter text-zinc-900 font-mono">
                          {duration}
                        </span>
                        <button 
                          onClick={() => setDuration(prev => Math.min(240, prev + 1))}
                          className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors bg-white shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <TimerIcon className="w-4 h-4 text-zinc-300" />
                        <span className="text-[10px] font-black tracking-widest text-zinc-300 uppercase">
                          {duration >= 60 ? `${Math.floor(duration / 60)}H ${duration % 60}M` : "MINUTES"} READY
                        </span>
                      </div>
                    </div>

                    {/* Interactive Progress Background representing duration */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-[0.03]">
                      <circle
                        cx="160" cy="160" r="150"
                        className="fill-none stroke-zinc-900 stroke-[40px]"
                        strokeDasharray="942"
                        strokeDashoffset={942 - (942 * duration) / 240}
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-10 w-full max-w-md">
                  <div className="w-full flex flex-col gap-6 px-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2">
                      <span>1M</span>
                      <span className="text-zinc-900">{duration} MIN</span>
                      <span>4H</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="240" 
                      step="1"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-3 w-full px-4">
                    {[15, 25, 45, 60, 120].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          "py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border",
                          duration === d 
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105" 
                            : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200"
                        )}
                      >
                        {d >= 60 ? `${d/60}H` : `${d}M`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleStart}
                    className="w-full py-7 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[2.5rem] hover:bg-black transition-all shadow-2xl shadow-zinc-900/20 active:scale-[0.98] flex items-center justify-center gap-4 group"
                  >
                    <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                    INITIATE FOCUS SYNC
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-20 w-full"
              >
                <div className="relative">
                  <svg className="w-[340px] h-[340px] -rotate-90">
                    <circle
                      cx="170" cy="170" r="160"
                      className="fill-none stroke-zinc-50 stroke-[6px]"
                    />
                    <motion.circle
                      cx="170" cy="170" r="160"
                      className="fill-none stroke-purple-600 stroke-[6px]"
                      strokeDasharray="1005"
                      animate={{ strokeDashoffset: 1005 - (1005 * progress) / 100 }}
                      transition={{ duration: 1, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-8xl font-black tracking-tighter text-zinc-900 font-mono">
                      {formatTime(timeLeft)}
                    </span>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-600">
                        RESONATING
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <button
                    onClick={handleStop}
                    className="group px-12 py-5 bg-white border border-zinc-100 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                    <Square className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                    ABORT PROTOCOL
                  </button>
                  <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">DETECTION: EXTERNAL APP VISIBILITY = FAIL</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Failed Notification */}
        <AnimatePresence>
          {failed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-8 p-10 rounded-[3rem] bg-red-50 border border-red-100 flex flex-col items-center gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-black text-red-900 uppercase tracking-tighter">Connection Refused</h4>
                <p className="text-xs text-red-600/70 font-bold uppercase tracking-widest leading-loose">Session failed due to external distraction detected.</p>
              </div>
              <button 
                onClick={() => setFailed(false)}
                className="px-8 py-3 bg-red-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black transition-all"
              >
                Dismiss Protocol
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
