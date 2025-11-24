# Simple Developer Tools

A collection of privacy-focused, client-side developer tools built with Next.js 14, TailwindCSS, and Monaco Editor.

## 🛠️ Tools Included

### 1. JSON Editor (`/json-editor`)
A powerful, real-time JSON editing and formatting tool.
- **Dual-Pane Interface**: Raw input on the left, formatted/editable output on the right.
- **Monaco Editor**: Professional code editing experience with syntax highlighting and error detection.
- **Features**: 
  - Format & Minify JSON
  - Real-time Validation
  - Copy to Clipboard & Download File
- **Privacy**: 100% client-side processing. Your data never leaves the browser.

### 2. Image Converter (`/image-converter`)
A simple tool to convert HEIC images to standard web formats.
- **HEIC to JPG/PNG**: Easily convert Apple's HEIC format to widely supported formats.
- **Client-Side Conversion**: Uses `heic2any` to process images directly in your browser without uploading them to a server.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

## 💻 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Image Processing**: `heic2any`
- **Icons**: Lucide React

## 📦 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
