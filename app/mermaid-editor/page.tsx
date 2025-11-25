"use client";

import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
    Info,
    Code2,
    Image as ImageIcon,
    FileImage,
    FileCode,
    ZoomIn,
    ZoomOut,
    Maximize,
    Palette,
    Check
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

// Define available themes
const THEMES = [
    { id: 'default', name: 'Default' },
    { id: 'neutral', name: 'Neutral' },
    { id: 'dark', name: 'Dark' },
    { id: 'forest', name: 'Forest' },
    { id: 'base', name: 'Modern (Base)' },
];

const EXAMPLES = {
    'Flowchart': `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B
    style A fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style C fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style D fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff`,
    'Sequence': `sequenceDiagram
    participant A as Alice
    participant J as John
    A->>J: Hello John, how are you?
    J-->>A: Great!
    A-)J: See you later!`,
    'Class': `classDiagram
    classArgument --|> Class
    classArgument : +int id
    classArgument : +String name
    classArgument : +void doSomething()
    class Class{
      +String name
      +void method()
    }`,
    'State': `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
    'Gantt': `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    Prototype      :a1, 2023-01-01, 30d
    Review         :after a1  , 20d
    section Dev
    Frontend       :2023-01-12  , 12d
    Backend        : 24d`,
    'Pie': `pie title Pets
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
    'ER Diagram': `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
};

export default function MermaidEditor() {
    const { theme: globalTheme } = useTheme();
    const [code, setCode] = useState(EXAMPLES['Flowchart']);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);
    const [showThemes, setShowThemes] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync Mermaid theme with global theme
    useEffect(() => {
        setCurrentTheme(globalTheme === 'dark' ? 'dark' : 'default');
    }, [globalTheme]);

    // Initialize/Re-initialize mermaid when theme changes
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: currentTheme as any,
            securityLevel: 'loose',
            fontFamily: "'Inter', 'ui-sans-serif', 'system-ui', sans-serif",
            themeVariables: currentTheme === 'base' ? {
                primaryColor: '#6366f1',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#4f46e5',
                lineColor: '#94a3b8',
                secondaryColor: '#ec4899',
                tertiaryColor: '#f1f5f9',
                fontFamily: "'Inter', 'ui-sans-serif', 'system-ui', sans-serif",
                fontSize: '16px',
            } : undefined,
            flowchart: {
                curve: 'basis',
                htmlLabels: true,
            }
        });

        // Trigger re-render
        const renderDiagram = async () => {
            try {
                const id = `mermaid-svg-${Date.now()}`;
                const { svg } = await mermaid.render(id, code);

                // Parse SVG to fix dimensions for zooming
                const parser = new DOMParser();
                const doc = parser.parseFromString(svg, 'image/svg+xml');
                const svgElement = doc.documentElement;

                // Ensure it fills the container
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                svgElement.style.maxWidth = 'none';

                // Remove explicit width/height attributes if they exist to allow CSS scaling
                // But keep viewBox for aspect ratio
                if (svgElement.hasAttribute('width')) svgElement.removeAttribute('width');
                if (svgElement.hasAttribute('height')) svgElement.removeAttribute('height');

                setSvg(svgElement.outerHTML);
                setError('');
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Syntax Error: ' + (err instanceof Error ? err.message : String(err)));
            }
        };
        renderDiagram();
    }, [currentTheme, code]);

    const handleDownload = async (format: 'png' | 'svg') => {
        if (!containerRef.current) return;

        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) return;

        // Get the real size of the SVG content from viewBox
        let width = 0;
        let height = 0;
        let viewBox = svgElement.getAttribute('viewBox');

        if (viewBox) {
            const parts = viewBox.split(/\s+|,/);
            if (parts.length === 4) {
                width = parseFloat(parts[2]);
                height = parseFloat(parts[3]);
            }
        }

        // Fallback to BBox if viewBox is missing or invalid
        if (!width || !height) {
            const bbox = svgElement.getBBox();
            width = bbox.width;
            height = bbox.height;
        }

        // Add padding for the export
        const padding = 20;
        const exportWidth = width + padding * 2;
        const exportHeight = height + padding * 2;

        if (format === 'svg') {
            const clone = svgElement.cloneNode(true) as SVGSVGElement;
            clone.setAttribute('width', `${exportWidth}`);
            clone.setAttribute('height', `${exportHeight}`);

            // Adjust viewBox to include padding
            const currentViewBox = viewBox ? viewBox.split(/\s+|,/).map(Number) : [0, 0, width, height];
            if (currentViewBox.length === 4) {
                clone.setAttribute('viewBox', `${currentViewBox[0] - padding} ${currentViewBox[1] - padding} ${exportWidth} ${exportHeight}`);
            }

            const svgData = new XMLSerializer().serializeToString(clone);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagram-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // PNG Download
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            // Scale up for better resolution (Retina quality)
            const scale = 3;
            canvas.width = exportWidth * scale;
            canvas.height = exportHeight * scale;

            if (ctx) {
                ctx.scale(scale, scale);
                // White background for PNG, or dark if dark mode? 
                // Usually export is preferred on white/transparent, but let's stick to white for compatibility
                // or match theme? Let's use white for now as standard.
                ctx.fillStyle = currentTheme === 'dark' ? '#1e1e1e' : '#ffffff';
                ctx.fillRect(0, 0, exportWidth, exportHeight);
            }

            const clone = svgElement.cloneNode(true) as SVGSVGElement;
            clone.setAttribute('width', `${width}`);
            clone.setAttribute('height', `${height}`);
            if (!clone.getAttribute('viewBox')) {
                clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }

            const svgData = new XMLSerializer().serializeToString(clone);

            img.onload = () => {
                if (ctx) {
                    ctx.drawImage(img, padding, padding, width, height);
                    const pngUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = pngUrl;
                    link.download = `diagram-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shadow-sm z-10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Code2 size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Mermaid Live Editor</h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Theme Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowThemes(!showThemes)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                        >
                            <Palette size={16} />
                            <span>Theme: {THEMES.find(t => t.id === currentTheme)?.name}</span>
                        </button>
                        {showThemes && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-100 dark:border-neutral-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => {
                                            setCurrentTheme(theme.id);
                                            setShowThemes(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center justify-between"
                                    >
                                        {theme.name}
                                        {currentTheme === theme.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Templates */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTutorial(!showTutorial)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <Info size={16} />
                            Templates
                        </button>
                        {showTutorial && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-100 dark:border-neutral-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-4 bg-gray-50 dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-700">
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Select a Template</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to load an example</p>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                                    {Object.keys(EXAMPLES).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setCode(EXAMPLES[type as keyof typeof EXAMPLES]);
                                                setShowTutorial(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-md transition-colors flex items-center justify-between group"
                                        >
                                            <span>{type}</span>
                                            <span className="opacity-0 group-hover:opacity-100 text-indigo-400">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Editor Section */}
                <div className="w-1/2 border-r border-gray-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 transition-colors duration-300">
                    <div className="bg-gray-50 dark:bg-neutral-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
                        <Code2 size={14} />
                        Code Input
                    </div>
                    <div className="flex-1 pt-2">
                        <Editor
                            key={globalTheme} // Force re-mount on theme change
                            height="100%"
                            defaultLanguage="markdown"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            theme={globalTheme === 'dark' ? "vs-dark" : "light"}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                padding: { top: 16, bottom: 16 },
                            }}
                        />
                    </div>
                </div>

                {/* Preview Section */}
                <div className="w-1/2 flex flex-col bg-gray-50/50 dark:bg-neutral-900/50 relative transition-colors duration-300">
                    <div className="bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={14} />
                            Live Preview
                        </div>
                        <div className="flex items-center gap-2">
                            {error ? (
                                <span className="text-red-500 flex items-center gap-1 normal-case bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 mr-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Syntax Error
                                </span>
                            ) : (
                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1 normal-case bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-900/30 mr-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Ready
                                </span>
                            )}
                            <div className="h-4 w-px bg-gray-300 dark:bg-neutral-700 mx-1"></div>
                            <button
                                onClick={() => handleDownload('png')}
                                className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-neutral-800 rounded transition-colors"
                                title="Download PNG"
                            >
                                <FileImage size={14} />
                                <span className="hidden sm:inline">PNG</span>
                            </button>
                            <button
                                onClick={() => handleDownload('svg')}
                                className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-neutral-800 rounded transition-colors"
                                title="Download SVG"
                            >
                                <FileCode size={14} />
                                <span className="hidden sm:inline">SVG</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] dark:bg-none">
                        {error && (
                            <div className="absolute top-4 left-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm text-sm font-mono whitespace-pre-wrap z-20">
                                {error}
                            </div>
                        )}

                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={8}
                            centerOnInit
                            limitToBounds={false}
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                                        <button onClick={() => zoomIn()} className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300" title="Zoom In">
                                            <ZoomIn size={20} />
                                        </button>
                                        <button onClick={() => zoomOut()} className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300" title="Zoom Out">
                                            <ZoomOut size={20} />
                                        </button>
                                        <button onClick={() => resetTransform()} className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300" title="Reset View">
                                            <Maximize size={20} />
                                        </button>
                                    </div>
                                    <TransformComponent
                                        wrapperClass="w-full h-full"
                                        contentClass="w-full h-full flex items-center justify-center"
                                    >
                                        <div
                                            ref={containerRef}
                                            className={`transition-all duration-300 ${error ? 'opacity-50 blur-sm grayscale' : 'opacity-100'} w-full h-full flex items-center justify-center`}
                                            dangerouslySetInnerHTML={{ __html: svg }}
                                        />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    </div>
                </div>
            </main>
        </div>
    );
}
