"use strict";
import React, { useRef, useState } from 'react';
import { Camera, Sparkles, Loader2, X, FileText } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { cn } from '@/lib/utils';

interface OCRImportProps {
    onImport: (text: string) => void;
    className?: string;
}

export function OCRImport({ onImport, className }: OCRImportProps) {
    const [image, setImage] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState<string>('');

    // For PDF processing
    const [pdfDoc, setPdfDoc] = useState<any>(null); // Use any to avoid type issues with dynamic import

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (file.type === 'application/pdf') {
                setFileType('pdf');
                const arrayBuffer = await file.arrayBuffer();
                try {
                    // Dynamic import for SSR compatibility
                    const pdfjs = await import('pdfjs-dist');
                    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    setPdfDoc(pdf);

                    // Render first page immediately for preview
                    renderPdfPage(pdf, 1);
                } catch (err) {
                    console.error("Error loading PDF", err);
                    alert("Could not load PDF file.");
                }
            } else {
                setFileType('image');
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (typeof ev.target?.result === 'string') {
                        setImage(ev.target.result);
                        setPdfDoc(null);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const renderPdfPage = async (pdf: any, pageNum: number) => {
        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                setImage(canvas.toDataURL('image/png'));
            }
        } catch (err) {
            console.error("Error rendering PDF page", err);
        }
    };

    // --- Shared Layout Kernel (Anchored Strategy) ---
    const reconstructPageLayout = (items: any[], viewportWidth: number): string => {
        if (items.length === 0) return '';

        // 1. Group into lines based on Y
        const lines: { y: number; items: typeof items, isChord: boolean }[] = [];
        const TOLERANCE = viewportWidth * 0.01;

        // Helper: Detect if a line is likely chords
        const calculateIsChord = (lineItems: any[]): boolean => {
            const combinedText = lineItems.map(i => i.str).join(' ').trim();
            if (combinedText.length === 0) return false;
            if (/^\[.*\]$/.test(combinedText)) return false; // [Chorus] is not a chord line

            const tokens = combinedText.split(/\s+/);
            const chordRegex = /^[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|M|7|9|11|13|5|6)*[0-9]*(?:\/[A-G][#b]?)?$/;

            let chordCount = 0;
            tokens.forEach(t => {
                // Ignore empty or tiny tokens
                if (t.length > 0 && chordRegex.test(t)) chordCount++;
            });

            // Strict threshold: > 40% of tokens must be chords
            return (chordCount / tokens.length) > 0.4;
        };

        items.forEach((item: any) => {
            const existingLine = lines.find(l => Math.abs(l.y - item.y) < TOLERANCE);
            if (existingLine) {
                existingLine.items.push(item);
            } else {
                lines.push({ y: item.y, items: [item], isChord: false });
            }
        });

        // 2. Sort lines Top-to-Bottom
        lines.sort((a, b) => a.y - b.y);

        // 3. Classify Lines
        lines.forEach(l => {
            l.items.sort((a: any, b: any) => a.x - b.x);
            l.isChord = calculateIsChord(l.items);
        });

        let pageText = '';

        // 4. Process Lines with Lookahead for Pairing
        for (let i = 0; i < lines.length; i++) {
            const current = lines[i];
            const next = lines[i + 1];

            // Check for Chord -> Lyric Pair
            // Condition: Current is Chords, Next exists AND is Lyrics
            // Also check Y-distance? Ideally yes, but usually adjacent in array is enough if sorted.
            if (current.isChord && next && !next.isChord) {
                // --- PAIRED PROCESSING ---

                // Step A: Process Lyric Line (The "Master")
                // Strategy: Natural Flow (Relative Spacing)
                let lyricLineStr = '';
                let lastXEnd = 0;
                // Map: Interval [startCol, endCol] covers InputInterval [startX, endX]
                const spatialMap: { startX: number, endX: number, startCol: number }[] = [];

                // Check indent
                if (next.items.length > 0 && next.items[0].x > viewportWidth * 0.05) {
                    lyricLineStr += '  ';
                }

                next.items.forEach((item: any) => {
                    const gap = item.x - lastXEnd;
                    // Add space if physical gap > 3px (approx space width)
                    if (lastXEnd > 0 && gap > 3) {
                        lyricLineStr += ' ';
                    }

                    // Record Mapping
                    spatialMap.push({
                        startX: item.x,
                        endX: item.x + item.w,
                        startCol: lyricLineStr.length
                    });

                    lyricLineStr += item.str;
                    lastXEnd = item.x + item.w;
                });

                // Step B: Process Chord Line (The "Slave")
                // Strategy: Anchor to SpatialMap
                let chordLineStr = '';

                current.items.forEach((chord: any) => {
                    const chordCenter = chord.x + (chord.w / 2);

                    // Find the 'word' under this chord
                    // We match if chordCenter is within (or close to) a word's X range
                    let targetCol = -1;

                    // Try strict intersection first
                    const match = spatialMap.find(m => chordCenter >= m.startX - 5 && chordCenter <= m.endX + 5);

                    if (match) {
                        // Align to the start of that word (often looks best)
                        targetCol = match.startCol;
                    } else {
                        // Fallback: Find closest word
                        // If no overlap, just fallback to relative position extrapolation?
                        // "Floating Chord"
                        // Use a rough char width estimate to guess col
                        targetCol = Math.floor(chord.x / 10);
                    }

                    // Place chord
                    const padding = Math.max(0, targetCol - chordLineStr.length);
                    if (padding > 0) chordLineStr += ' '.repeat(padding);
                    // If we are past strict target, just append spacing so it doesn't merge
                    else if (chordLineStr.length > 0) chordLineStr += ' ';

                    chordLineStr += chord.str;
                });

                pageText += chordLineStr.trimEnd() + '\n';
                pageText += lyricLineStr.trimEnd() + '\n';

                i++; // Skip next line since we processed it as a pair
            } else {
                // --- INDEPENDENCE PROCESSING (Grid Fallback) ---
                // This handles Intro chords, or block lyrics without chords
                // Use the 'Relaxed Grid' (1.15x) from before as it was decent for uniform stuff

                const GRID_UNIT = 12; // Hardcoded avg approx for simplicity or calc median again
                // Let's reuse the median calc for robustness if we wanted, but 12px is safe for ~12pt font

                let lineStr = '';
                current.items.forEach((item: any) => {
                    const targetCol = Math.floor(item.x / GRID_UNIT);
                    const padding = Math.max(0, targetCol - lineStr.length);
                    if (padding > 0) lineStr += ' '.repeat(padding);
                    lineStr += item.str;
                });
                pageText += lineStr.trimEnd() + '\n';
            }
        }

        return pageText;
    };

    // --- Native Text Extraction Logic ---
    const extractTextFromPDF = async (pdf: any): Promise<string> => {
        let fullDocumentText = '';
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
            setProgress(`Reading page ${i} of ${numPages}...`);
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const viewport = page.getViewport({ scale: 1.0 });

                if (textContent.items.length === 0) throw new Error("No text layer");

                // Normalize items for Kernel (Invert PDF Y to be Top-Down)
                const items = textContent.items.map((item: any) => ({
                    str: item.str,
                    x: item.transform[4],
                    y: viewport.height - item.transform[5], // Invert Y
                    w: item.width
                }));

                fullDocumentText += reconstructPageLayout(items, viewport.width) + '\n';

            } catch (err) {
                console.warn(`Page ${i} native read failed`, err);
                throw err;
            }
        }

        return fullDocumentText;
    };


    // --- Helper for Image Pre-processing ---
    const preprocessImage = (imageSource: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Scale up by 2.5x for better recognition of small text
                const scale = 2.5;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(imageSource);
                    return;
                }

                // Draw scaled image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Binarization (High Contrast)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const threshold = 128; // Standard midpoint

                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const val = avg > threshold ? 255 : 0;
                    data[i] = val;
                    data[i + 1] = val;
                    data[i + 2] = val;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageSource;
        });
    };

    // --- Helper for Image OCR (Fallback) ---
    const runImageOCR = async (worker: any, imageSource: string) => {
        // Pre-process image for better accuracy
        const processedImage = await preprocessImage(imageSource);

        // Simple recognize call - we already configured the worker in runOCR
        const { data } = await worker.recognize(processedImage);

        if (!data || !data.words) {
            console.warn("Tesseract returned no word data");
            return data?.text || '';
        }

        // Map Tesseract Words to Kernel Items
        // Scale down coordinates to match original viewport size roughly (optional, but keeps math sane)
        const scale = 2.5;
        const items = data.words.map((word: any) => ({
            str: word.text,
            x: word.bbox.x0 / scale,
            y: word.bbox.y0 / scale,
            w: (word.bbox.x1 - word.bbox.x0) / scale
        }));

        // Determine approximate viewport width from the bbox extremes
        const maxX = items.length > 0
            ? Math.max(...items.map((i: any) => i.x + i.w)) + 50
            : 1000;

        return reconstructPageLayout(items, maxX);
    };

    // Helper to render a page to a data URL without affecting the preview state
    const getPageImage = async (pdf: any, pageNum: number): Promise<string> => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 3.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        if (context) {
            // Fill with white background to handle transparent PDFs correctly
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: context, viewport }).promise;
            return canvas.toDataURL('image/png');
        }
        return '';
    };

    const runOCR = async () => {
        if (!image && !pdfDoc) return;
        setScanning(true);

        try {
            // Attempt Native PDF Extraction FIRST
            if (fileType === 'pdf' && pdfDoc) {
                try {
                    console.log("Attempting native PDF extraction...");
                    const text = await extractTextFromPDF(pdfDoc);
                    // Check if we actually got text (sometimes PDFs have empty text layers)
                    if (text.trim().length > 10) {
                        onImport(text);
                        setScanning(false);
                        return; // Success! Skip OCR.
                    }
                    console.log("Native extraction yielded empty text, falling back to OCR.");
                } catch (err) {
                    console.log("Native extraction failed, falling back to OCR.", err);
                }
            }

            // --- Fallback to OCR (Original Logic) ---
            const worker = await createWorker('eng');
            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/[]#() .,-:\'',
                preserve_interword_spaces: '1',
                tessedit_pageseg_mode: '6' as any,
            });

            let fullText = '';

            if (fileType === 'pdf' && pdfDoc) {
                const numPages = pdfDoc.numPages;
                for (let i = 1; i <= numPages; i++) {
                    setProgress(`Scanning (OCR) page ${i} of ${numPages}...`);
                    const pageImage = await getPageImage(pdfDoc, i);
                    fullText += `\n` + await runImageOCR(worker, pageImage);
                }
            } else if (image) {
                setProgress('Scanning image...');
                fullText = await runImageOCR(worker, image);
            }

            onImport(fullText);
            await worker.terminate();

        } catch (err) {
            console.error("Extraction Failed", err);
            alert("Could not extract text.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            {!image ? (
                <div
                    className="w-full h-56 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-sky-400 transition-all group p-6 text-center"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="bg-sky-50 dark:bg-slate-800 p-4 rounded-full mb-3 text-sky-500 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-200">Upload File</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Supports <strong>PDF</strong>, PNG, JPG or Screenshots</p>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner group-preview">
                        {/* Image Container */}
                        <img src={image} alt="Preview" className="w-full h-full object-contain" />

                        {/* PDF Badge */}
                        {fileType === 'pdf' && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                PDF (Page 1)
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setImage(null);
                                setPdfDoc(null);
                            }}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {scanning ? (
                        <button disabled className="w-full bg-slate-100 text-slate-400 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait">
                            <Loader2 className="animate-spin" size={18} /> {progress || 'Processing...'}
                        </button>
                    ) : (
                        <button
                            onClick={runOCR}
                            className="w-full bg-[#90AB8B] text-white border border-[#90AB8B] shadow-md px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#829b7d] hover:shadow-lg hover:shadow-[#90AB8B]/20 active:scale-95 transition-all"
                        >
                            <Sparkles size={18} /> {fileType === 'pdf' ? 'Extract from PDF' : 'Extract Chords'}
                        </button>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/heic, application/pdf"
                onChange={handleFileChange}
            />
        </div>
    );
}
