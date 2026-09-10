"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Bộ skill", icon: "▤" },
  { href: "/templates", label: "Template chuẩn", icon: "◈" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/packs") : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-panel/60 px-3 py-6">
        <Link href="/" className="mb-8 block px-2">
          <div className="text-base font-semibold text-white">Agent Skill Studio</div>
          <div className="text-xs text-slate-400">Claude · Copilot · Codex</div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-slate-400">
          Mỗi bộ skill là một pack độc lập. Template chuẩn chỉ dùng làm khuôn, không sửa được.
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
