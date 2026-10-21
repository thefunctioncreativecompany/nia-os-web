import type { Metadata } from "next";
import { geist, geistMono, instrumentSerif } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// The live site, so link-preview images get full addresses (same as Supabase's Site URL).
export const metadata: Metadata = {
  metadataBase: new URL("https://app.niatechnologies.co"),
  title: "Nia OS",
  description: "The operating system for creative production.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
