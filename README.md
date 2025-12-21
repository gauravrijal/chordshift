# 🎸 ChordShift

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://chordshift-five.vercel.app/)

**ChordShift** is a modern, professional web application designed for musicians to instantly transpose chord charts, format lyrics, and perform live with smart autoscroll.

Built with **Next.js 15**, **Tailwind CSS v4**, and **TypeScript**, it prioritizes speed, accuracy, and a premium "Sage Green" aesthetic.

[**View Live App**](https://chordshift-five.vercel.app/)

![ChordShift Logo](/public/logo.png)

## ✨ Key Features

### 🎼 Smart Transposition
- **Instant Key Change**: Shift songs up or down by semitones while preserving exact chord placement.
- **Intelligent Parsing**: Automatically detects chords (bracketed `[C]` or inline `Am7`) and keeps lyrics aligned.
- **Notation Control**: Toggles for Sharps (#), Flats (b), or "Auto" mode to guess the best enharmonic spelling.

### 📜 Silky Smooth Autoscroll
- **Engine**: Rewritten sub-pixel scrolling engine for jitter-free movement on any screen (60fps+).
- **Exponential Speed Control**:
  - **Levels 1-5**: Slow crawl for practicing.
  - **Levels 15-20**: Fast scanning for review.
- **Play/Pause**: Quick toggle for live performance control.

### 🌓 Premium Dark Mode
- **Palette**: "True Neutral" Dark Mode (`neutral-950` background) for an OLED-friendly, deep black experience without the blue tint.
- **Theme**: Accent elements use a curated **Sage Green** (`#90AB8B`) for a calm, professional look.
- **Smart Toggle**: Persists user preference transparently.

### 📂 File Handling & OCR
- **PDF Import**: Upload chord charts directly.
- **OCR Engine**: Extracts text and chords from images/scans roughly, ready for formatting.
- **Export**: Download your transposed chart as a clean `.txt` file or a formatted `.pdf`.

### 📱 Responsive & Accessible
- **Mobile Read**: Fully responsive layout that adapts to phones and tablets.
- **Hamburger Menu**: Animated menu for clean navigation on smaller screens.
- **Click-Outside**: Intuitive interaction design.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State**: React Hooks (`useState`, `useEffect`, `useRef`) for local state.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Build for Production

This project is optimized for Vercel deployment but can be built locally:

```bash
npm run build
npm start
```



## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Designed for Musicians • Simple & Accurate*
