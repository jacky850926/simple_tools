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

## 🐳 Docker Support

You can run this application easily using Docker.

### One-Click Start
Run the helper script to build and start the container:
```bash
./start.sh
```
The app will be available at [http://localhost:3002](http://localhost:3002).

### Manual Commands
```bash
# Build and start
docker-compose up -d --build

# Stop
docker-compose down
```

### Offline Distribution (Save/Load Image)
To run this app on another machine without building from source:

1. **Export Image** (on source machine):
   ```bash
   docker save -o simple_tools.tar simple_tools
   ```
2. **Transfer** the `simple_tools.tar` file to the target machine.
3. **Import Image** (on target machine):
   ```bash
   docker load -i simple_tools.tar
   ```
4. **Run Container** (on target machine):
   ```bash
   # Run on port 3002 (or change 3002 to any port you like)
   docker run -d --restart always -p 3002:3000 simple_tools
   ```
