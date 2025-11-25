"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileJson, Image as ImageIcon, Wrench, Code2, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function Navigation() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const isActive = (path: string) => {
        return pathname.startsWith(path)
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            : "text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800";
    };

    return (
        <nav className="fixed left-0 top-0 h-full w-16 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col items-center py-6 z-50 transition-colors duration-300">
            <div className="mb-8 p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Wrench className="w-6 h-6 text-white" />
            </div>

            <div className="flex flex-col gap-4 w-full px-2">
                <Link
                    href="/json-editor"
                    className={`p-3 rounded-xl transition-all flex justify-center group relative ${isActive("/json-editor")}`}
                >
                    <FileJson className="w-6 h-6" />
                    <span className="absolute left-14 bg-gray-800 dark:bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 dark:border-neutral-700 pointer-events-none z-50">
                        JSON Editor
                    </span>
                </Link>

                <Link
                    href="/image-converter"
                    className={`p-3 rounded-xl transition-all flex justify-center group relative ${isActive("/image-converter")}`}
                >
                    <ImageIcon className="w-6 h-6" />
                    <span className="absolute left-14 bg-gray-800 dark:bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 dark:border-neutral-700 pointer-events-none z-50">
                        Image Converter
                    </span>
                </Link>

                <Link
                    href="/mermaid-editor"
                    className={`p-3 rounded-xl transition-all flex justify-center group relative ${isActive("/mermaid-editor")}`}
                >
                    <Code2 className="w-6 h-6" />
                    <span className="absolute left-14 bg-gray-800 dark:bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 dark:border-neutral-700 pointer-events-none z-50">
                        Mermaid Editor
                    </span>
                </Link>
            </div>

            <div className="mt-auto mb-4 px-2 w-full">
                <button
                    onClick={toggleTheme}
                    className="w-full p-3 rounded-xl transition-all flex justify-center group relative text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                >
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    <span className="absolute left-14 bg-gray-800 dark:bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 dark:border-neutral-700 pointer-events-none z-50">
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>
            </div>
        </nav>
    );
}
