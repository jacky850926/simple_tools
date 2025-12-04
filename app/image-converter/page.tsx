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
    FileImage,
    FileType
} from "lucide-react";

import { useTheme } from "../components/ThemeProvider";

export default function ImageConverter() {
    const { theme } = useTheme();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
    const [quality, setQuality] = useState(80);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
    const [convertedInfo, setConvertedInfo] = useState<{ size: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
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
        <div
            className="min-h-screen font-sans p-8 transition-colors duration-300"
            style={{
                backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f9fafb',
                color: theme === 'dark' ? '#e5e5e5' : '#111827'
            }}
        >
            <div className="max-w-5xl mx-auto flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-neutral-800 pb-6 transition-colors duration-300">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                        <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            Image Converter
                        </h1>
                        <p className="text-gray-500 dark:text-neutral-400 mt-1">
                            Convert HEIC, WEBP, PNG, GIF, BMP, AVIF to optimized JPG format.
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
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group
                ${selectedFile || isDragging
                                    ? "border-purple-500/50 bg-purple-500/5"
                                    : "hover:border-purple-500/50"
                                }
              `}
                            style={{
                                borderColor: (selectedFile || isDragging) ? undefined : (theme === 'dark' ? '#404040' : '#d1d5db'),
                                backgroundColor: (selectedFile || isDragging) ? undefined : (theme === 'dark' ? 'transparent' : '#f3f4f6'),
                            }}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".jpg,.jpeg,.png,.heic,.webp,.gif,.bmp,.avif,.tiff,.ico"
                                className="hidden"
                            />
                            <div
                                className="p-4 rounded-full group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }}
                            >
                                <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium" style={{ color: theme === 'dark' ? '#e5e5e5' : '#111827' }}>
                                    {isDragging ? "Drop image here" : "Click to upload or drag & drop"}
                                </p>
                                <p className="text-sm mt-1" style={{ color: theme === 'dark' ? '#737373' : '#6b7280' }}>
                                    HEIC, WEBP, PNG, JPG, GIF, BMP, AVIF
                                </p>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <div
                            className="border rounded-2xl p-6 backdrop-blur-sm transition-colors duration-300"
                            style={{
                                backgroundColor: theme === 'dark' ? 'rgba(23, 23, 23, 0.5)' : '#ffffff',
                                borderColor: theme === 'dark' ? '#262626' : '#e5e7eb'
                            }}
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h2 className="font-semibold" style={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>Compression Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm" style={{ color: theme === 'dark' ? '#a3a3a3' : '#6b7280' }}>Quality</label>
                                    <span className="text-sm font-mono text-purple-600 dark:text-purple-400">{quality}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    style={{ backgroundColor: theme === 'dark' ? '#262626' : '#e5e7eb' }}
                                />
                                <p className="text-xs" style={{ color: theme === 'dark' ? '#737373' : '#6b7280' }}>
                                    Lower quality = smaller file size.
                                </p>
                            </div>

                            <button
                                onClick={convertImage}
                                disabled={!selectedFile || isProcessing}
                                className={`
                  w-full mt-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                  ${!selectedFile
                                        ? "text-gray-400 dark:text-neutral-500 cursor-not-allowed"
                                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 active:scale-95"
                                    }
                `}
                                style={{
                                    backgroundColor: !selectedFile ? (theme === 'dark' ? '#262626' : '#e5e7eb') : undefined
                                }}
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
                            <div
                                className="border rounded-2xl p-4 flex items-center gap-3 transition-colors duration-300"
                                style={{
                                    backgroundColor: theme === 'dark' ? 'rgba(23, 23, 23, 0.5)' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#262626' : '#e5e7eb'
                                }}
                            >
                                <div className="p-2 rounded-lg" style={{ backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }}>
                                    <FileImage className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>{fileInfo.name}</p>
                                    <p className="text-xs" style={{ color: theme === 'dark' ? '#737373' : '#6b7280' }}>{formatSize(fileInfo.size)} • {fileInfo.type}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                        setConvertedUrl(null);
                                        setFileInfo(null);
                                    }}
                                    className="p-1 rounded hover:text-red-500 transition-colors"
                                    style={{
                                        color: theme === 'dark' ? '#737373' : '#6b7280',
                                        backgroundColor: 'transparent' // Hover handled by CSS usually, but let's keep it simple
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Preview & Result */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-200 p-4 rounded-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                                {error}
                            </div>
                        )}

                        {!previewUrl ? (
                            <div
                                className="flex-1 min-h-[400px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors duration-300"
                                style={{
                                    backgroundColor: theme === 'dark' ? 'rgba(23, 23, 23, 0.3)' : '#f3f4f6',
                                    borderColor: theme === 'dark' ? '#262626' : '#d1d5db',
                                    color: theme === 'dark' ? '#525252' : '#6b7280'
                                }}
                            >
                                <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
                                <p>Upload an image to see preview</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                {/* Original */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium" style={{ color: theme === 'dark' ? '#a3a3a3' : '#6b7280' }}>Original</span>
                                        <span
                                            className="text-xs px-2 py-1 rounded"
                                            style={{
                                                backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6',
                                                color: theme === 'dark' ? '#a3a3a3' : '#6b7280'
                                            }}
                                        >
                                            {fileInfo ? formatSize(fileInfo.size) : ''}
                                        </span>
                                    </div>
                                    <div
                                        className="relative aspect-square rounded-xl overflow-hidden border transition-colors duration-300"
                                        style={{
                                            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                                            borderColor: theme === 'dark' ? '#262626' : '#e5e7eb'
                                        }}
                                    >
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
                                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Converted Output</span>
                                        {convertedInfo && (
                                            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-500/20">
                                                {formatSize(convertedInfo.size)}
                                                {fileInfo && (
                                                    <span className="ml-1 opacity-70">
                                                        ({Math.round((convertedInfo.size / fileInfo.size) * 100)}%)
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className="relative aspect-square rounded-xl overflow-hidden border flex items-center justify-center transition-colors duration-300"
                                        style={{
                                            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                                            borderColor: theme === 'dark' ? '#262626' : '#e5e7eb'
                                        }}
                                    >
                                        {convertedUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={convertedUrl}
                                                alt="Converted"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-sm text-center px-4" style={{ color: theme === 'dark' ? '#525252' : '#6b7280' }}>
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
