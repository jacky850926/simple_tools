"use client";

import { useState, useRef, useEffect } from "react";
import {
    Upload,
    Image as ImageIcon,
    Download,
    Settings,
    AlertCircle,
    Check,
    X,
    FileImage
} from "lucide-react";

export default function ImageConverter() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [quality, setQuality] = useState(80);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
    const [convertedInfo, setConvertedInfo] = useState<{ size: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (convertedUrl) URL.revokeObjectURL(convertedUrl);
        };
    }, [previewUrl, convertedUrl]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset state
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (convertedUrl) URL.revokeObjectURL(convertedUrl);
        setConvertedUrl(null);
        setConvertedInfo(null);
        setError(null);

        setSelectedFile(file);
        setFileInfo({
            name: file.name,
            size: file.size,
            type: file.type
        });

        try {
            // Handle HEIC files
            if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
                setIsProcessing(true);
                const heic2any = (await import('heic2any')).default;
                const blob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: quality / 100
                });

                const url = URL.createObjectURL(Array.isArray(blob) ? blob[0] : blob);
                setPreviewUrl(url);
                setIsProcessing(false);
                // Auto convert to apply current quality settings properly if needed, 
                // but heic2any already did it. Let's just treat this as the "source" for now.
                // Actually, for consistency, let's just show preview.
            } else {
                // Standard images
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            }
        } catch (err: any) {
            setError("Failed to load image: " + err.message);
            setIsProcessing(false);
        }
    };

    const convertImage = async () => {
        if (!selectedFile && !previewUrl) return;

        setIsProcessing(true);
        setError(null);

        try {
            // If it's already a blob url (from HEIC conversion or file selection)
            // We draw it to canvas to apply JPEG compression
            const img = new Image();
            img.src = previewUrl!;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error("Could not get canvas context");

            // Draw white background for transparent PNGs
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (b) => b ? resolve(b) : reject(new Error("Conversion failed")),
                    'image/jpeg',
                    quality / 100
                );
            });

            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setConvertedInfo({ size: blob.size });

        } catch (err: any) {
            setError("Conversion failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadImage = () => {
        if (!convertedUrl) return;

        const a = document.createElement('a');
        a.href = convertedUrl;
        // Use original name but change extension
        const originalName = fileInfo?.name || 'image';
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        a.download = `${nameWithoutExt}_converted.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-8">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                        <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Image Converter
                        </h1>
                        <p className="text-neutral-400 mt-1">
                            Convert HEIC, PNG, JPG to optimized JPG format.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Upload & Settings */}
                    <div className="lg:col-span-1 flex flex-col gap-6">

                        {/* Upload Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group
                ${selectedFile
                                    ? "border-purple-500/50 bg-purple-500/5"
                                    : "border-neutral-700 hover:border-purple-500/50 hover:bg-neutral-900"
                                }
              `}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".jpg,.jpeg,.png,.heic"
                                className="hidden"
                            />
                            <div className="p-4 bg-neutral-800 rounded-full group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-neutral-200">Click to upload</p>
                                <p className="text-sm text-neutral-500 mt-1">HEIC, PNG, JPG supported</p>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Settings className="w-5 h-5 text-purple-400" />
                                <h2 className="font-semibold">Compression Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-neutral-400">Quality</label>
                                    <span className="text-sm font-mono text-purple-400">{quality}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <p className="text-xs text-neutral-500">
                                    Lower quality = smaller file size.
                                </p>
                            </div>

                            <button
                                onClick={convertImage}
                                disabled={!selectedFile || isProcessing}
                                className={`
                  w-full mt-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                  ${!selectedFile
                                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 active:scale-95"
                                    }
                `}
                            >
                                {isProcessing ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Convert to JPG
                                    </>
                                )}
                            </button>
                        </div>

                        {/* File Info */}
                        {fileInfo && (
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-lg">
                                    <FileImage className="w-5 h-5 text-neutral-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{fileInfo.name}</p>
                                    <p className="text-xs text-neutral-500">{formatSize(fileInfo.size)} • {fileInfo.type}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                        setConvertedUrl(null);
                                        setFileInfo(null);
                                    }}
                                    className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Preview & Result */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {error && (
                            <div className="bg-red-950/50 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                {error}
                            </div>
                        )}

                        {!previewUrl ? (
                            <div className="flex-1 min-h-[400px] bg-neutral-900/30 border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-neutral-600">
                                <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
                                <p>Upload an image to see preview</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                {/* Original */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-neutral-400">Original</span>
                                        <span className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-400">
                                            {fileInfo ? formatSize(fileInfo.size) : ''}
                                        </span>
                                    </div>
                                    <div className="relative aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={previewUrl}
                                            alt="Original"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Converted */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-purple-400">Converted Output</span>
                                        {convertedInfo && (
                                            <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-500/20">
                                                {formatSize(convertedInfo.size)}
                                                {fileInfo && (
                                                    <span className="ml-1 opacity-70">
                                                        ({Math.round((convertedInfo.size / fileInfo.size) * 100)}%)
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                                        {convertedUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={convertedUrl}
                                                alt="Converted"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-neutral-600 text-sm text-center px-4">
                                                {isProcessing ? "Processing..." : "Click 'Convert' to see result"}
                                            </div>
                                        )}
                                    </div>

                                    {convertedUrl && (
                                        <button
                                            onClick={downloadImage}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download JPG
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
