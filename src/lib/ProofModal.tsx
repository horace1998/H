import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Upload } from "lucide-react";

export type Proof = {
  kind: "image" | "video";
  name: string;
  url: string;
};

export function ProofModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (proof?: Proof) => void }) {
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [kind, setKind] = useState<"image" | "video">("image");

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xl bg-white border border-zinc-200 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Evidence Required</p>
            <h3 className="text-xl font-extrabold tracking-tighter">Submit Proof</h3>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-900"><X className="w-5 h-5" /></button>
        </div>
        
        <label className="block border-2 border-dashed border-zinc-100 rounded-3xl p-10 text-center cursor-pointer hover:bg-zinc-50 transition-all">
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const url = URL.createObjectURL(file); setPreview(url); setFileName(file.name);
              setKind(file.type.startsWith("video") ? "video" : "image");
            }} 
          />
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-zinc-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Upload Media</span>
          </div>
        </label>

        {preview && (
          <div className="mt-6 border border-zinc-100 rounded-2xl overflow-hidden aspect-video">
            {kind === "image" ? <img src={preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <video src={preview} controls className="w-full h-full object-cover" />}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 py-4 bg-white border-2 border-zinc-900 text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSubmit(preview ? { kind, name: fileName, url: preview } : undefined)} 
              className="flex-[2] py-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              Confirm with Proof
            </button>
          </div>
          <button 
             onClick={() => onSubmit(undefined)}
             className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 transition-colors"
          >
             Skip Proof & Just Sync
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
