// app/api/vibrant/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// --- Type Definitions (Same as before) ---
interface VibrantBuilder {
    quality(n: number): VibrantBuilder;
    maxColorCount(n: number): VibrantBuilder;
    getPalette(): Promise<unknown>; 
}

type SwatchLike = {
    hex: string;
    rgb: number[];
    population: number;
};

interface VibrantConstructor {
    new (data: Buffer): VibrantBuilder;
    from(data: Buffer): VibrantBuilder;
    Vibrant?: VibrantConstructor;
    default?: VibrantConstructor;
}

interface VibrantModule {
    Vibrant?: VibrantConstructor;
    default?: VibrantConstructor;
}

// --- Modified function to get ALL dominant, unique colors sorted by population ---

/**
 * Extracts all unique, dominant colors from the palette and sorts them by pixel population.
 * @param palette The raw palette object from node-vibrant.
 * @returns An array of SwatchLike objects, sorted by population (descending).
 */
const getDominantColors = (palette: Record<string, SwatchLike | null>): SwatchLike[] => {
    const allSwatches = Object.values(palette)
        .filter((swatch): swatch is SwatchLike => Boolean(swatch));

    // Use a Map to store unique colors by hex, prioritizing the one with higher population 
    // (though in this case, population should be identical for duplicate hexes).
    const uniqueSwatches = new Map<string, SwatchLike>();

    for (const swatch of allSwatches) {
        // This ensures no duplicate hex codes are added, keeping the palette clean.
        if (!uniqueSwatches.has(swatch.hex)) {
            uniqueSwatches.set(swatch.hex, swatch);
        }
    }

    // Convert Map values back to an array and sort by population in descending order.
    // The highest population color (most dominant) will be first.
    return Array.from(uniqueSwatches.values()).sort((a, b) => b.population - a.population);
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File | null;
        
        const qualityStr = formData.get("quality") as string | null;
        const maxColorCountStr = formData.get("maxColorCount") as string | null;

        const quality = qualityStr ? parseInt(qualityStr, 10) : 1;
        const maxColorCount = maxColorCountStr ? parseInt(maxColorCountStr, 10) : 256;


        if (!file) {
            return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const vibrantModule = (await import("node-vibrant/node") as unknown) as VibrantModule;

        const VibrantCtor: VibrantConstructor | undefined = 
            vibrantModule.Vibrant || vibrantModule.default;
        
        if (!VibrantCtor) {
             throw new Error("Could not find Vibrant constructor in imported module.");
        }

        let vibrantBuilder: VibrantBuilder;

        if (typeof VibrantCtor.from === "function") {
            vibrantBuilder = VibrantCtor.from(buffer);
        } else if (typeof VibrantCtor === 'function') {
            vibrantBuilder = new VibrantCtor(buffer);
        } else {
            throw new Error("Vibrant constructor is not callable.");
        }

        // Apply high-accuracy parameters (using user input)
        const palette = await vibrantBuilder
            .quality(quality) 
            .maxColorCount(maxColorCount) 
            .getPalette();

        // 🛠️ NEW: Use the function to get all dominant colors sorted by population
        const allSwatches = palette as Record<string, SwatchLike | null>;
        const colors = getDominantColors(allSwatches);

        return NextResponse.json({ colors });
    } catch (err) {
        console.error("Color extraction failed:", err);
        return NextResponse.json(
            { error: `Internal Server Error: Failed to extract colors. Details: ${(err as Error).message}` },
            { status: 500 }
        );
    }
}