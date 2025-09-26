// app/api/vibrant/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 1. Define the required external type for the Builder object's method
interface VibrantBuilder {
  quality(n: number): VibrantBuilder;
  maxColorCount(n: number): VibrantBuilder;
  getPalette(): Promise<unknown>;
}

// 2. Define the expected shape of the Swatch data returned directly from the palette
type SwatchLike = {
  hex: string;
  rgb: number[];
  population: number;
};

// 3. Define the expected shape of the Vibrant constructor function/class
interface VibrantConstructor {
  new (data: Buffer): VibrantBuilder;
  from(data: Buffer): VibrantBuilder;
  Vibrant?: VibrantConstructor;
  default?: VibrantConstructor;
}

// 4. Define the expected shape of the dynamically imported module
interface VibrantModule {
  Vibrant?: VibrantConstructor;
  default?: VibrantConstructor;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- FIX APPLIED: Convert to 'unknown' first to resolve overlap error ---
    const vibrantModule = (await import(
      "node-vibrant/node"
    )) as unknown as VibrantModule;

    const VibrantCtor: VibrantConstructor | undefined =
      vibrantModule.Vibrant || vibrantModule.default;

    if (!VibrantCtor) {
      throw new Error("Could not find Vibrant constructor in imported module.");
    }
    // ---------------------------------------------------------------------------

    let vibrantBuilder: VibrantBuilder;

    // Determine the correct instantiation method
    if (typeof VibrantCtor.from === "function") {
      vibrantBuilder = VibrantCtor.from(buffer);
    } else if (typeof VibrantCtor === "function") {
      // Instantiate using 'new'. The local interface ensures we expect a VibrantBuilder result.
      vibrantBuilder = new VibrantCtor(buffer);
    } else {
      throw new Error("Vibrant constructor is not callable.");
    }

    // Apply accuracy improvements
    const palette = await vibrantBuilder
      .quality(1)
      .maxColorCount(256)
      .getPalette();

    const colors = Object.values(palette as Record<string, SwatchLike | null>)
      .filter((swatch): swatch is SwatchLike => Boolean(swatch))
      .map((swatch) => ({
        hex: swatch.hex,
        rgb: swatch.rgb,
        population: swatch.population,
      }));

    return NextResponse.json({ colors });
  } catch (err) {
    console.error("Color extraction failed:", err);
    return NextResponse.json(
      {
        error: `Internal Server Error: Failed to extract colors. Details: ${
          (err as Error).message
        }`,
      },
      { status: 500 }
    );
  }
}
