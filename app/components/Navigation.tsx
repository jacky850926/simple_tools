"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileJson, Image as ImageIcon, Wrench } from "lucide-react";

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname.startsWith(path) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-neutral-400 hover:text-white hover:bg-neutral-800";
    };

    return (
        <nav className="fixed left-0 top-0 h-full w-16 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-6 z-50">
            <div className="mb-8 p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Wrench className="w-6 h-6 text-white" />
            </div>

            <div className="flex flex-col gap-4 w-full px-2">
                <Link
                    href="/json-editor"
                    className={`p-3 rounded-xl transition-all flex justify-center group relative ${isActive("/json-editor")}`}
                >
                    <FileJson className="w-6 h-6" />
                    <span className="absolute left-14 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-neutral-700 pointer-events-none">
                        JSON Editor
                    </span>
                </Link>

                <Link
                    href="/image-converter"
                    className={`p-3 rounded-xl transition-all flex justify-center group relative ${isActive("/image-converter")}`}
                >
                    <ImageIcon className="w-6 h-6" />
                    <span className="absolute left-14 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-neutral-700 pointer-events-none">
                        Image Converter
                    </span>
                </Link>
            </div>
        </nav>
    );
}
