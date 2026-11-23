"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-[var(--bg-surface)] !text-[var(--text-primary)] !border !border-[var(--border-strong)] !shadow-xl !rounded-xl !text-[13px]",
          description: "!text-[var(--text-secondary)] !text-[12px]",
          actionButton:
            "!bg-indigo-500 !text-white hover:!bg-indigo-400 !font-medium !text-xs !rounded-md",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
