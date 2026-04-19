import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toPng } from "html-to-image";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function exportAsImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }
  
  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2, // Higher resolution
      backgroundColor: '#ffffff'
    });
    
    // Create download link
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Export image failed", err);
  }
}

