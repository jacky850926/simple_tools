"use client";

import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import mermaid from 'mermaid';
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

    // Custom Pan/Zoom State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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

                // Parse SVG to fix dimensions
                const parser = new DOMParser();
                const doc = parser.parseFromString(svg, 'image/svg+xml');
                const svgElement = doc.documentElement;

                // Ensure it fills the container naturally but respects aspect ratio
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                svgElement.style.maxWidth = 'none';

                // Remove explicit width/height attributes to allow CSS scaling
                if (svgElement.hasAttribute('width')) svgElement.removeAttribute('width');
                if (svgElement.hasAttribute('height')) svgElement.removeAttribute('height');

                setSvg(svgElement.outerHTML);
                setError('');

                // Reset view on new render? Optional, maybe keep it.
                // setZoom(1);
                // setPan({ x: 0, y: 0 });
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Syntax Error: ' + (err instanceof Error ? err.message : String(err)));
            }
        };
        renderDiagram();
    }, [currentTheme, code]);

    // Pan/Zoom Handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const scaleAmount = -e.deltaY * 0.001;
            const newZoom = Math.min(Math.max(0.1, zoom + scaleAmount), 5);
            setZoom(newZoom);
        } else {
            // Optional: Pan on scroll if not zooming?
            // For now let's just allow standard scrolling if content is larger, 
            // but since we are using transform, standard scroll won't work the same.
            // Let's map wheel to pan if not zooming.
            setPan(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.1));
    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleDownload = async (format: 'png' | 'svg') => {
        if (!contentRef.current) return;

        const svgElement = contentRef.current.querySelector('svg');
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

        if (!width || !height) {
            const bbox = svgElement.getBBox();
            width = bbox.width;
            height = bbox.height;
        }

        const padding = 20;
        const exportWidth = width + padding * 2;
        const exportHeight = height + padding * 2;

        if (format === 'svg') {
            const clone = svgElement.cloneNode(true) as SVGSVGElement;
            clone.setAttribute('width', `${exportWidth}`);
            clone.setAttribute('height', `${exportHeight}`);

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
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            const scale = 3;
            canvas.width = exportWidth * scale;
            canvas.height = exportHeight * scale;

            if (ctx) {
                ctx.scale(scale, scale);
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
        <div className="min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shadow-sm z-10 transition-colors duration-300 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Code2 size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight hidden sm:block">Mermaid Live Editor</h1>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight sm:hidden">Mermaid</h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Theme Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowThemes(!showThemes)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                        >
                            <Palette size={16} />
                            <span className="hidden sm:inline">Theme: {THEMES.find(t => t.id === currentTheme)?.name}</span>
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
                            <span className="hidden sm:inline">Templates</span>
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

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Editor Section */}
                <div className="w-full lg:w-1/2 h-[400px] lg:h-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 transition-colors duration-300 shrink-0">
                    <div className="bg-gray-50 dark:bg-neutral-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
                        <Code2 size={14} />
                        Code Input
                    </div>
                    <div className="flex-1 pt-2 min-h-0">
                        <Editor
                            key={globalTheme}
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
                <div className="w-full lg:w-1/2 flex-1 flex flex-col bg-gray-50/50 dark:bg-neutral-900/50 relative transition-colors duration-300 min-h-[400px]">
                    <div className="bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={14} />
                            Live Preview
                        </div>
                        <div className="flex items-center gap-2">
                            {error ? (
                                <span className="text-red-500 flex items-center gap-1 normal-case bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 mr-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="hidden sm:inline">Syntax Error</span>
                                    <span className="sm:hidden">Error</span>
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

                    <div
                        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing transition-colors duration-300"
                        style={{ backgroundColor: globalTheme === 'dark' ? '#1e1e1e' : '#ffffff' }}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        ref={containerRef}
                    >
                        {error && (
                            <div className="absolute top-4 left-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-sm text-sm font-mono whitespace-pre-wrap z-20">
                                {error}
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                            <button onClick={handleZoomIn} className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300" title="Zoom In">
                                <ZoomIn size={20} />
                            </button>
                            <button onClick={handleZoomOut} className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300" title="Zoom Out">
                                <ZoomOut size={20} />
                            </button>
                            <button onClick={handleReset} className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300" title="Reset View">
                                <Maximize size={20} />
                            </button>
                        </div>

                        <div
                            ref={contentRef}
                            className={`transition-transform duration-100 ease-out origin-center w-full h-full flex items-center justify-center ${error ? 'opacity-50 blur-sm grayscale' : 'opacity-100'}`}
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                            }}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
