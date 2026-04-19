import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { Database, Search, Users, Palette, Terminal, AlertCircle, RefreshCw, Upload, Camera, Edit3, CheckCircle, XCircle, Image as ImageIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";
import fandomsJson from "../fandoms.json";

interface FandomDoc {
  groupId: string;
  meta: {
    displayName: string;
    fandomName: string;
  };
  terminology: any;
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
  createdAt?: any;
}

export default function FandomRegistry() {
  const [fandoms, setFandoms] = useState<FandomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<FandomDoc | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ id: string, status: 'idle' | 'processing' | 'success' | 'error' }>({ id: '', status: 'idle' });
  const [showDevMode, setShowDevMode] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchRegistry = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "fandom_registry"), orderBy("groupId", "asc"));
      const querySnapshot = await getDocs(q);
      const docs: FandomDoc[] = [];
      querySnapshot.forEach((doc) => {
        docs.push(doc.data() as FandomDoc);
      });
      setFandoms(docs);
      if (docs.length > 0) {
        if (selectedGroup) {
          const fresh = docs.find(d => d.groupId === selectedGroup.groupId);
          if (fresh) setSelectedGroup(fresh);
        } else if (window.innerWidth > 768) {
          setSelectedGroup(docs[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching fandom registry:", err);
      setError("FAILED TO CONNECT TO FANDOM_REGISTRY. ENSURE DATA IS SEEDED.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      console.log("Seeding registry from local source...");
      for (const group of fandomsJson) {
        const docRef = doc(db, "fandom_registry", group.groupId);
        await updateDoc(docRef, {
          ...group,
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true
        }).catch(async (err) => {
          // If update fails, try setDoc (create)
          if (err.code === 'not-found') {
            const { setDoc } = await import("firebase/firestore");
            await setDoc(docRef, {
              ...group,
              createdAt: new Date(),
              updatedAt: new Date(),
              active: true
            });
          } else {
            throw err;
          }
        });
      }
      await fetchRegistry();
    } catch (err) {
      console.error("Seeding failed:", err);
      setError("SEEDING_FAILED: CHECK_FIRESTORE_RULES");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleImageUpload = async (file: File, targetId: string, isGroup: boolean) => {
    setUploadStatus({ id: targetId, status: 'processing' });
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 600;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          
          if (!selectedGroup) return;
          const docRef = doc(db, "fandom_registry", selectedGroup.groupId);
          
          if (isGroup) {
            await updateDoc(docRef, {
              "assets.customPassportProfile": base64
            });
          } else {
            const updatedMembers = selectedGroup.members.map(m => 
              m.id === targetId ? { ...m, customImage: base64 } : m
            );
            await updateDoc(docRef, {
              members: updatedMembers
            });
          }
          
          setUploadStatus({ id: targetId, status: 'success' });
          setTimeout(() => setUploadStatus({ id: '', status: 'idle' }), 2000);
          fetchRegistry();
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadStatus({ id: targetId, status: 'error' });
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const filteredFandoms = fandoms.filter(f => 
    f.meta.displayName.toLowerCase().includes(search.toLowerCase()) ||
    f.groupId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden font-mono">
      {/* Header - Simple for Mobile */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:px-10 gap-4 border-b border-zinc-100 bg-white z-20">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-900" />
              <h1 className="text-lg font-black tracking-tighter uppercase leading-none">REGISTRY</h1>
            </div>
            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-1">DB_SYNC_V2</span>
          </div>
          
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={fetchRegistry} 
              className="p-2 bg-zinc-50 rounded-lg"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-zinc-500", loading && "animate-spin")} />
            </button>
            <button 
              onClick={() => setShowDevMode(!showDevMode)}
              className={cn(
                "p-2 rounded-lg border text-[8px] font-black tracking-widest",
                showDevMode ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-300 border-zinc-100"
              )}
            >
              DEV
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setShowDevMode(!showDevMode)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                showDevMode ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-400 border-zinc-200 hover:text-zinc-900"
              )}
            >
              {showDevMode ? "DEV_MODE: ON" : "DEV_MODE: OFF"}
            </button>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-300" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="FILTER_NODES..."
              className="w-full bg-zinc-50/50 border border-zinc-100 rounded-lg py-1.5 pl-8 pr-3 text-[9px] uppercase font-bold tracking-widest outline-none focus:border-zinc-900 transition-all"
            />
          </div>
          <button 
            onClick={fetchRegistry} 
            className="hidden md:flex p-2 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-all"
          >
            <RefreshCw className={cn("w-4 h-4 text-zinc-500", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left List - Responsive */}
        <aside className={cn(
          "md:w-72 border-r border-zinc-100 overflow-y-auto custom-scrollbar flex flex-col transition-all",
          selectedGroup ? "hidden md:flex" : "w-full md:flex bg-white"
        )}>
          {loading && (
             <div className="p-12 flex flex-col items-center justify-center gap-4 opacity-50">
                <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">CONNECTING_DB</span>
             </div>
          )}

          {error && !loading && (
             <div className="p-12 flex flex-col items-center text-center gap-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 leading-relaxed mx-auto max-w-[200px]">{error}</span>
                <button onClick={fetchRegistry} className="px-6 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">REBOOT_LINK</button>
             </div>
          )}

          {!loading && !error && filteredFandoms.length === 0 && (
             <div className="p-12 flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                  <Database className="w-8 h-8 text-zinc-200" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">EMPTY_REGISTRY_DETECTED</span>
                  <span className="text-[9px] font-bold text-zinc-400 leading-relaxed uppercase">The database node is offline or uninitialized.</span>
                </div>
                <button 
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="w-full py-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}
                  {isSeeding ? "TRANSMITTING..." : "INITIALIZE_DATABASE"}
                </button>
             </div>
          )}

          {!loading && filteredFandoms.map(f => (
            <button
              key={f.groupId}
              onClick={() => setSelectedGroup(f)}
              className={cn(
                "w-full p-5 md:p-6 text-left border-b border-zinc-50 transition-all flex flex-col gap-1 relative",
                selectedGroup?.groupId === f.groupId ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
              )}
            >
              {selectedGroup?.groupId === f.groupId && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white" />}
              <span className="text-[9px] uppercase font-black tracking-tighter opacity-50 block mb-0.5">{f.groupId}</span>
              <span className="text-[13px] font-black uppercase tracking-tight leading-tight">{f.meta.displayName}</span>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: f.theme.primaryColor }} />
                 <span className={cn("text-[9px] uppercase font-bold tracking-widest", selectedGroup?.groupId === f.groupId ? "text-zinc-400" : "text-zinc-300")}>
                    {f.members.length} MEMBERS
                 </span>
              </div>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto custom-scrollbar",
          selectedGroup ? "block bg-zinc-50 md:bg-zinc-50/30" : "hidden md:flex items-center justify-center bg-zinc-50/10"
        )}>
          {selectedGroup ? (
            <div className="p-4 md:p-10 pb-40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedGroup.groupId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-14"
                >
                  {/* Mobile Back Button & Actions */}
                  <div className="md:hidden flex items-center justify-between mb-2">
                     <button 
                       onClick={() => setSelectedGroup(null)}
                       className="px-4 py-2.5 bg-zinc-50 border border-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2"
                     >
                        <XCircle className="w-3.5 h-3.5" />
                        DATABASE_LIST
                     </button>
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: selectedGroup.theme.primaryColor }} />
                     </div>
                  </div>

                  {/* Meta Header */}
                  <header className="flex flex-col gap-6 bg-white p-6 md:p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
                        <Database className="w-32 h-32" />
                     </div>
                     
                     <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="px-3 py-1 bg-zinc-900 text-white text-[8px] font-black tracking-widest rounded-full uppercase italic">SYNC_ID: {selectedGroup.groupId}</span>
                           {selectedGroup.members.some(m => m.customImage) && (
                              <span className="px-3 py-1 bg-green-500 text-white text-[8px] font-black tracking-widest rounded-full uppercase">CUSTOM_ASSETS</span>
                           )}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-zinc-900 leading-[0.9]">{selectedGroup.meta.displayName}</h2>
                        <div className="flex flex-col md:flex-row md:items-center gap-x-8 gap-y-3">
                          <p className="text-[10px] md:text-[11px] text-zinc-400 font-bold uppercase tracking-[0.4em] border-l-2 border-zinc-900 pl-4">
                             FANDOM: {selectedGroup.meta.fandomName}
                          </p>
                          <p className="text-[10px] md:text-[11px] text-zinc-400 font-bold uppercase tracking-[0.4em] border-l-2 border-zinc-100 md:pl-4">
                             THEME: {selectedGroup.theme.variant.replace('_', ' ')}
                          </p>
                        </div>
                     </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
                     {/* Asset Management */}
                     <div className="flex flex-col gap-10">
                        {/* Main Group Asset Upload */}
                        <div className="flex flex-col gap-5">
                          <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-zinc-900" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-900">GROUP_PROFILE_ASSET</span>
                             </div>
                             <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">MIN: 600x800 px</span>
                          </div>
                          
                          <div className="relative group/passport overflow-hidden rounded-[3rem] bg-white border-2 border-zinc-50 shadow-2xl transition-all hover:scale-[1.01]">
                             <div className="aspect-[3/4] w-full relative">
                                {selectedGroup.assets.customPassportProfile || selectedGroup.assets.passportProfile ? (
                                   <img 
                                     src={selectedGroup.assets.customPassportProfile || selectedGroup.assets.passportProfile} 
                                     className={cn(
                                       "w-full h-full object-cover transition-all duration-700",
                                       uploadStatus.id === 'group' && "opacity-50 blur-xl"
                                     )} 
                                     referrerPolicy="no-referrer" 
                                   />
                                ) : (
                                   <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
                                      <ImageIcon className="w-16 h-16 text-zinc-100" />
                                   </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/passport:opacity-100 transition-all flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                                   <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-zinc-900 shadow-2xl">
                                      <Upload className="w-8 h-8" />
                                   </div>
                                   <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">REPLACE_MASTER_ASSET</span>
                                   <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="absolute inset-0 opacity-0 cursor-pointer" 
                                     onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'group', true)}
                                   />
                                </div>

                                {/* Mobile Always Visible Action Overlay */}
                                <div className="md:hidden absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
                                   <div className="flex flex-col gap-1">
                                      <span className="text-[8px] font-black text-white uppercase tracking-widest opacity-70">SYNK_SYSTEM</span>
                                      <span className="text-[10px] font-black text-white uppercase tracking-widest">TAP_TO_UPLOAD</span>
                                   </div>
                                   <div className="relative">
                                      <div className="w-12 h-12 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-2xl">
                                         <Upload className="w-5 h-5" />
                                      </div>
                                      <input 
                                         type="file" 
                                         accept="image/*" 
                                         className="absolute inset-0 opacity-0 cursor-pointer" 
                                         onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'group', true)}
                                      />
                                   </div>
                                </div>

                                {uploadStatus.id === 'group' && uploadStatus.status === 'processing' && (
                                   <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                                      <RefreshCw className="w-10 h-10 text-white animate-spin" />
                                      <span className="text-[11px] font-black text-white uppercase tracking-widest animate-pulse">TRANSMITTING_DATA...</span>
                                   </div>
                                )}

                                {uploadStatus.id === 'group' && uploadStatus.status === 'success' && (
                                   <div className="absolute top-8 right-8 bg-green-500 text-white p-3 rounded-full shadow-2xl animate-bounce">
                                      <CheckCircle className="w-6 h-6" />
                                   </div>
                                )}
                             </div>
                             
                             <div className="p-8 bg-zinc-900 flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">SYNK_ARCHIVE_NODE // v2.4</span>
                                {selectedGroup.assets.customPassportProfile && (
                                   <span className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_green]" />
                                      OVERRIDE_ACTIVE
                                   </span>
                                )}
                             </div>
                          </div>
                        </div>

                        {showDevMode && (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2 px-2">
                               <Terminal className="w-4 h-4 text-zinc-400" />
                               <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 italic">RAW_JSON_METADATA</span>
                            </div>
                            <div className="bg-zinc-950 p-8 rounded-[2rem] text-[10px] text-zinc-500 overflow-x-auto custom-scrollbar-dark leading-relaxed font-mono whitespace-pre shadow-2xl border border-zinc-900">
                               {JSON.stringify(selectedGroup, null, 2)}
                            </div>
                          </motion.div>
                        )}
                     </div>

                     {/* Registry Preview */}
                     <div className="flex flex-col gap-10">
                        <div className="flex items-center justify-between mb-2 pb-6 border-b border-zinc-100 px-2">
                           <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-zinc-900" />
                              <span className="text-[13px] font-black uppercase tracking-tighter text-zinc-900">MEMBER_NODES</span>
                           </div>
                           <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">CNT: {selectedGroup.members.length}</span>
                        </div>
                        
                        <div className="flex flex-col gap-5">
                           {selectedGroup.members.map(m => (
                             <div key={m.id} className="flex flex-col bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-zinc-200">
                                <div className="p-5 md:p-6 flex items-center gap-6">
                                   {/* Avatar Section */}
                                   <div className="relative group/avatar shrink-0">
                                      <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border border-zinc-100 bg-zinc-50 shadow-inner relative">
                                         <img 
                                           src={m.customImage || `https://picsum.photos/seed/${selectedGroup.groupId + m.id}/400/400`} 
                                           className={cn(
                                              "w-full h-full object-cover transition-all duration-700",
                                              !m.customImage && "grayscale opacity-50 group-hover/avatar:grayscale-0 group-hover/avatar:opacity-100",
                                              uploadStatus.id === m.id && uploadStatus.status === 'processing' && "blur-md opacity-40"
                                           )} 
                                           referrerPolicy="no-referrer" 
                                         />
                                         
                                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                            <Upload className="w-6 h-6 text-white" />
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              className="absolute inset-0 opacity-0 cursor-pointer" 
                                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], m.id, false)}
                                            />
                                         </div>

                                         {uploadStatus.id === m.id && uploadStatus.status === 'processing' && (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                               <RefreshCw className="w-6 h-6 text-white animate-spin" />
                                            </div>
                                         )}

                                         {uploadStatus.id === m.id && uploadStatus.status === 'success' && (
                                            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
                                               <CheckCircle className="w-6 h-6 text-white animate-bounce" />
                                            </div>
                                         )}
                                      </div>
                                   </div>

                                   {/* Info Section */}
                                   <div className="flex-1 flex flex-col justify-center gap-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                         <span className="text-[14px] font-black text-zinc-900 uppercase tracking-tighter leading-none">{m.name}</span>
                                         {m.customImage && (
                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded-lg border border-green-100 tracking-widest">LOCAL</span>
                                         )}
                                      </div>
                                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-none">{m.role || 'AGENT'}</span>
                                      <span className="text-[8px] font-black text-zinc-200 uppercase tracking-widest mt-1 opacity-60">ID://{m.id}</span>
                                   </div>

                                   {/* Desktop Action */}
                                   <div className="hidden md:flex items-center gap-2">
                                      <div className="relative group/btn cursor-pointer">
                                         <div className="px-5 py-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover/btn:bg-zinc-900 group-hover/btn:text-white group-hover/btn:border-zinc-900 transition-all flex items-center gap-2 shadow-sm">
                                            <Upload className="w-3.5 h-3.5" />
                                            REPLACE
                                         </div>
                                         <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], m.id, false)}
                                         />
                                      </div>
                                   </div>

                                   {/* Mobile Action Icon */}
                                   <div className="md:hidden flex items-center shrink-0">
                                      <div className="relative">
                                         <div className="px-3 py-2 bg-zinc-900 text-white rounded-xl flex items-center gap-2 shadow-lg">
                                            <Upload className="w-3 h-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">UPLOAD</span>
                                         </div>
                                         <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], m.id, false)}
                                         />
                                      </div>
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Persistence Notice */}
                  <div className="p-8 md:p-12 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-100 flex flex-col gap-6">
                     <div className="flex items-center gap-4">
                        <Terminal className="w-6 h-6 text-zinc-300" />
                        <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-zinc-900">DATA_SYNC_PROTOCOL</h4>
                     </div>
                     <p className="text-[11px] md:text-[12px] text-zinc-400 uppercase font-black tracking-widest leading-loose">
                        All uploaded assets are stored as <span className="text-zinc-900">BASE64_STREAMS</span> in Firestore. 
                        To rollback or batch update, target the <code className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic">fandom_registry</code> collection at the Firebase Console. 
                        Nodes with <span className="text-green-600">CUSTOM</span> flags override default algorithmic imagery.
                     </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-8 opacity-20 py-40">
               <Database className="w-20 h-20 animate-pulse" />
               <div className="flex flex-col items-center gap-2">
                 <span className="text-[12px] font-black uppercase tracking-[0.6em]">SELECT_REGISTRY_NODE</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">AWAITING_ORCHESTRATION_INPUT</span>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
