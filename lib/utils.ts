import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getConfidenceLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 0.8) return { label: "High", color: "text-emerald-400" };
  if (score >= 0.6) return { label: "Medium", color: "text-amber-400" };
  return { label: "Low", color: "text-red-400" };
}

export function getConfidenceBarColor(score: number): string {
  if (score >= 0.8) return "bg-emerald-400";
  if (score >= 0.6) return "bg-amber-400";
  return "bg-red-400";
}
