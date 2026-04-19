import React, { useState } from "react";
import { useSYNK } from "../Store";
import { useFandom } from "../FandomContext";
import { Fingerprint, Download, User as UserIcon, Shield, Map, LogOut, Radio } from "lucide-react";
import { motion } from "motion/react";
import { cn, exportAsImage } from "../utils";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { translations, Language } from "../translations";

export default function IdentityCard() {
  const { stats, customBackground, setCustomBackground, bias, roomAtmosphere, setRoomAtmosphere, customName, setCustomName, customPhoto, setCustomPhoto, user, username, setUsername, checkUsername, language, syncProfileData, setSyncProfileData, triggerAchievement } = useSYNK();
  const { activeConfig, switchFandom, fandoms } = useFandom();
  const t = translations[language as Language] || translations.en;

  const handleMemberSelect = async (memberId: string) => {
    await setSyncProfileData({ linkedMemberId: memberId });
    // Keep bias in sync for legacy compatibility
    const member = activeConfig.members.find(m => m.id === memberId);
    if (member) {
       // Only trigger achievement if changing
       triggerAchievement(`${member.name.toUpperCase()} LINKED`, `AGENT_BIAS_CALIBRATED`);
    }
  };

  const currentMember = activeConfig.members.find(m => m.id === syncProfileData.linkedMemberId) || activeConfig.members[0];
  const profileImage = currentMember?.customImage || (syncProfileData.linkedMemberId 
    ? `https://picsum.photos/seed/${activeConfig.groupId + syncProfileData.linkedMemberId}/600/800`
    : (activeConfig.assets.customPassportProfile || activeConfig.assets.passportProfile));
  const [showMotivation, setShowMotivation] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(customName);

  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleUpdateName = () => {
    setCustomName(tempName);
    setEditingName(false);
  };

  const handleCheckUsername = async () => {
    if (tempUsername.length < 3) return;
    setIsChecking(true);
    const available = await checkUsername(tempUsername);
    setIsAvailable(available);
    setIsChecking(false);
  };

  const handleConfirmUsername = async () => {
    const success = await setUsername(tempUsername);
    if (success) {
      setEditingUsername(false);
      setIsAvailable(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCustomPhoto(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-14 pb-32 overflow-y-auto custom-scrollbar overflow-x-hidden bg-white">
      <div className="max-w-6xl mx-auto w-full flex flex-col items-center justify-start text-center gap-10">
        {/* Minimalist Navigation */}
      <div className="flex flex-row gap-8 mb-16 border-b border-zinc-100 w-full justify-center">
        <button 
          onClick={() => setShowMotivation(false)}
          className={cn(
            "text-[10px] md:text-[11px] py-4 uppercase tracking-[0.2em] transition-all font-bold relative",
            !showMotivation ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-500"
          )}
        >
          {!showMotivation && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />}
          RESONANCE INDEX
        </button>
        <button 
          onClick={() => setShowMotivation(true)}
          className={cn(
            "text-[10px] md:text-[11px] py-4 uppercase tracking-[0.2em] transition-all font-bold relative",
            showMotivation ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-500"
          )}
        >
          {showMotivation && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />}
          PASSPORT TOKEN
        </button>
      </div>

      {!showMotivation ? (
        <motion.div
          key="identity"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-20 items-start pb-20"
        >
          {/* Left Column: Configurations */}
          <div className="flex flex-col gap-12 w-full max-w-[340px] mx-auto text-left">
             <header className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-4 font-bold">STATION CONFIG</span>
             </header>

             <div className="grid grid-cols-1 gap-8">
                {/* STATION ID section stays */}
                <div className="flex flex-col gap-3">
                   <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">STATION ID (UNIQUE)</span>
                   {editingUsername ? (
                      <div className="flex flex-col gap-2">
                         <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={tempUsername}
                             onChange={(e) => {
                               setTempUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''));
                               setIsAvailable(null);
                             }}
                             className="flex-1 bg-zinc-50 border border-zinc-100 px-4 py-3 rounded-2xl text-[11px] text-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 outline-none uppercase tracking-widest"
                             placeholder="STATION ID"
                             autoFocus
                           />
                           <button 
                             onClick={handleCheckUsername}
                             disabled={isChecking || tempUsername.length < 3}
                             className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
                           >
                             {isChecking ? "..." : "CHECK"}
                           </button>
                         </div>
                         {isAvailable === true && (
                           <div className="flex items-center justify-between px-2">
                              <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest">STATION ID AVAILABLE</span>
                              <button 
                                onClick={handleConfirmUsername}
                                className="text-[10px] font-black text-zinc-900 underline underline-offset-4 hover:text-green-600 transition-colors"
                              >
                                CLAIM ID
                              </button>
                           </div>
                         )}
                         {isAvailable === false && (
                            <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest px-2 italic">ID ALREADY ASSIGNED OR INVALID</span>
                         )}
                         <div className="flex justify-start">
                           <button 
                             onClick={() => { setEditingUsername(false); setIsAvailable(null); }}
                             className="text-[8px] tracking-[0.2em] text-zinc-400 hover:text-zinc-900 uppercase font-bold"
                           >
                             [ CANCEL ]
                           </button>
                         </div>
                      </div>
                   ) : (
                     <button 
                       onClick={() => { setTempUsername(username); setEditingUsername(true); }}
                       className="w-full py-3.5 text-[10px] text-left uppercase tracking-widest border border-zinc-100 rounded-2xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 px-5 transition-all flex items-center justify-between group"
                     >
                       <span className={cn(username ? "text-zinc-900 font-black" : "")}>
                          {username ? `@${username.toUpperCase()}` : "UNASSIGNED STATION"}
                       </span>
                       <Shield className="w-3 h-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                     </button>
                   )}
                </div>

                <div className="flex flex-col gap-3">
                   <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">BIOMETRIC</span>
                   <label className="flex items-center gap-4 px-5 py-4 border border-zinc-100 bg-white hover:bg-zinc-50 rounded-2xl transition-all cursor-pointer group">
                     {user?.photoURL || customPhoto ? (
                       <img src={customPhoto || user?.photoURL || ""} className="w-5 h-5 rounded-lg object-cover" referrerPolicy="no-referrer" />
                     ) : (
                       <UserIcon className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                     )}
                     <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 group-hover:text-zinc-900">SYNC PROTOCOL PHOTO</span>
                     <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                   </label>
                </div>
             </div>
          </div>

          {/* Right Column: Credentials */}
          <div className="flex flex-col gap-16 text-left">
            <header className="flex flex-col gap-2">
               <h1 className="text-6xl font-black tracking-tighter text-zinc-900 uppercase">IDENT</h1>
               <p className="text-[12px] text-zinc-400 uppercase tracking-widest font-bold border-l-2 border-zinc-900 pl-4">Biological Archive // Authorized</p>
            </header>

            <div className="flex flex-col gap-12">
               <div className="flex flex-col gap-8">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-300 border-b border-zinc-100 pb-4 font-bold">STATISTICS</span>
                  <div className="grid grid-cols-1 gap-12">
                     <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2">RESONANCE</span>
                        <div className="flex items-baseline gap-4">
                           <span className="text-7xl font-bold text-zinc-900 leading-none tracking-tighter">{stats.level}</span>
                           <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">L RANK</span>
                        </div>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2">UNITS COLLECTED</span>
                        <div className="flex items-baseline gap-4">
                           <span className="text-5xl font-bold text-zinc-900 leading-none tracking-tighter">{stats.experience}</span>
                           <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">SYNK EXTRACT</span>
                        </div>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2">TASKS COMPLETED</span>
                        <div className="flex items-baseline gap-4">
                           <span className="text-5xl font-bold text-zinc-900 leading-none tracking-tighter">{stats.completed_goals}</span>
                           <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">SUCCESS OPS</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-6 p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                  <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-zinc-900 animate-pulse" />
                     <h2 className="text-3xl font-bold uppercase tracking-tighter text-zinc-900">ELITE OPERATIVE</h2>
                  </div>
                  <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wide leading-relaxed">
                     Bio-metric verified. Access level 4 identified. Task synchronization active.
                  </p>
               </div>

               {/* Account Information Panel */}
               <div className="flex justify-between items-center w-full bg-white border border-zinc-100 p-6 rounded-[2rem] shadow-sm">
                 <div className="flex items-center gap-4">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-2xl object-cover shadow-md" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-zinc-200" />
                      </div>
                    )}
                    <div className="flex flex-col">
                       <span className="text-[11px] text-zinc-900 font-bold tracking-tight uppercase truncate max-w-[200px]">
                          {user?.displayName || "UNKNOWN"}
                          {user?.isAnonymous && <span className="ml-2 text-[9px] text-zinc-400">[GUEST]</span>}
                        </span>
                       <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-bold">SECURED SESSION</span>
                    </div>
                 </div>

                 <button 
                   onClick={handleSignOut}
                   className="w-10 h-10 rounded-2xl bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-all group"
                 >
                    <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                 </button>
               </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <MotivationCard activeConfig={activeConfig} profileImage={profileImage} />
      )}
    </div>
    </div>
  );
}

function MotivationCard({ activeConfig, profileImage }: { activeConfig: any, profileImage: string | null }) {
  const { bias, customName, customPhoto, language, username } = useSYNK();
  const t = translations[language as Language] || translations.en;
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      key="passport"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-12 pb-20 mt-10"
      style={{ perspective: 1200 }}
    >
      <header className="flex flex-col gap-2 items-center px-4">
         <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">{t.identity.passport}</h1>
         <p className="text-[12px] text-zinc-400 uppercase tracking-widest font-bold">{t.identity.encrypted}</p>
      </header>

      <motion.div
        id="synk-passport-card"
        className="w-[90vw] max-w-[400px] aspect-[1/1.4] bg-zinc-900 text-white relative overflow-hidden flex flex-col justify-between p-10 cursor-pointer shadow-2xl rounded-[3rem]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Background Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay grayscale"
          style={{ 
            backgroundImage: `url(${activeConfig.assets.passportTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="flex justify-between items-start w-full relative z-10 border-b border-white/5 pb-10">
          <div className="flex flex-col gap-6">
             <Fingerprint className="w-10 h-10 text-white" />
             <div className="w-24 h-32 bg-white/5 border border-white/10 overflow-hidden relative rounded-2xl">
                {customPhoto || profileImage ? (
                   <img 
                     src={customPhoto || profileImage} 
                     alt="Agent Profile"
                     className="w-full h-full object-cover opacity-95 shadow-lg grayscale hover:grayscale-0 transition-all duration-500"
                     referrerPolicy="no-referrer"
                   />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Fingerprint className="w-8 h-8 text-white/10" />
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
             </div>
          </div>
          <div className="text-right flex flex-col items-end pt-1">
            <span className="text-[12px] uppercase font-bold tracking-widest">PASSPORT.V2</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">#AE LOCK SECURED</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <h3 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">
            {username ? username.toUpperCase() : t.identity.citizen.split(' ')[0]}<br/>{username ? "" : t.identity.citizen.split(' ')[1] || ""}
          </h3>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{t.identity.mantra}</span>
            <p className="text-[15px] font-serif italic text-white/90 leading-relaxed">
              「We build our own reality in the negative space of the universe.」
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end relative z-10 border-t border-white/5 pt-10">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t.identity.coordinates}</span>
            <span className="text-[12px] uppercase font-bold tracking-widest">INTERNAL SERVO 01</span>
          </div>
          <div className="w-12 h-12 border border-white/10 bg-white/5 flex items-center justify-center rounded-2xl">
             <div className="w-6 h-6 border border-white/20" />
          </div>
        </div>
      </motion.div>

      <button 
        onClick={() => exportAsImage("synk-passport-card", "synk-passport.png")}
        className="flex items-center justify-center gap-6 px-12 py-5 bg-zinc-900 text-white rounded-[2rem] text-[12px] font-bold uppercase tracking-widest hover:bg-black transition-all group w-[80%] sm:w-auto shadow-xl"
      >
        <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" /> {t.identity.download}
      </button>
    </motion.div>
  );
}
