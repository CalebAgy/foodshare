"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Center toasts so they stay within the centered mobile frame instead of
      // appearing at the viewport edge on wider screens.
      position="top-center"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--width": "calc(28rem - 2rem)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Sonner dims the description by default — keep it readable.
          description: "group-[.toast]:text-popover-foreground group-[.toast]:opacity-90",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
