"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bottom-nav">
      <Link
        href="/"
        className={`nav-item ${isActive("/") ? "is-active" : ""}`}
      >
        <span className="nav-icon">📅</span>
        <span className="nav-label">Today</span>
      </Link>
      <Link
        href="/diet"
        className={`nav-item ${isActive("/diet") ? "is-active" : ""}`}
      >
        <span className="nav-icon">🍎</span>
        <span className="nav-label">Diet</span>
      </Link>
      <Link
        href="/health"
        className={`nav-item ${isActive("/health") ? "is-active" : ""}`}
      >
        <span className="nav-icon">💪</span>
        <span className="nav-label">Health</span>
      </Link>
    </nav>
  );
}
