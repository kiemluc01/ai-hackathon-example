import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "@/styles/globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Agent Skill Studio",
  description: "Quản lý, tạo mới và setup skill / agent cho Claude, Copilot, Codex...",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
