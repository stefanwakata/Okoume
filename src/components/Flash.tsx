"use client";
import { useEffect, useState } from "react";

function readFlash(): string | null {
  const m = document.cookie.split("; ").find((c) => c.startsWith("okoume_flash="));
  if (!m) return null;
  document.cookie = "okoume_flash=; Max-Age=0; path=/";
  let v = m.slice("okoume_flash=".length);
  for (let i = 0; i < 2 && v.includes("%"); i++) { try { v = decodeURIComponent(v); } catch { break; } }
  return v || null;
}

// One-shot message set by a Server Action (cookie, 20 s). Checked on an interval so it also shows
// after actions that refresh the page without navigating.
export function Flash() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const check = () => { const m = readFlash(); if (m) setMsg(m); };
    check();
    const id = setInterval(check, 400);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 6000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className="flash" role="status" aria-live="polite">{msg}</div>;
}
