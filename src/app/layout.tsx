import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LSAT Coach",
  description:
    "Log the LSAT questions you miss, isolate the exact reasoning skill behind each one, and drill AI-generated practice questions targeted at your gaps.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/wrong-questions", label: "Missed Questions" },
  { href: "/wrong-questions/new", label: "Log a Miss" },
  { href: "/history", label: "Practice History" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="font-semibold text-lg tracking-tight text-indigo-600 dark:text-indigo-400">
              LSAT Coach
            </Link>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-neutral-600 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-xs text-neutral-500">
            LSAT Coach is an independent study tool and is not affiliated with or endorsed by the Law School Admission Council (LSAC).
          </div>
        </footer>
      </body>
    </html>
  );
}
