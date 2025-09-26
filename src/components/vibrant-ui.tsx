"use client";

import { useState, useCallback, useMemo } from "react"; // Added useMemo/useCallback for potential future optimizations, but not strictly necessary here.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";

// --- Types ---
type Color = {
  hex: string;
  rgb: number[];
  population: number;
};

// --- Component ---
export function VibrantUI() {
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the image URL creation
  const imagePreviewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  // Clean up the object URL when the component unmounts or the file changes (optional but good practice)
  // You might add an effect for this cleanup if this component was mounted/unmounted frequently.

  const handleUpload = useCallback(async () => {
    if (!file) return;

    // Reset states
    setLoading(true);
    setError(null);
    setColors([]);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/vibrant", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        // Use a more specific error if available from the server
        setError(
          errData.error || `Failed to extract colors. Status: ${res.status}`
        );
        return;
      }

      const data = await res.json();
      setColors(data.colors || []);
    } catch (e) {
      console.error("Upload/Fetch Error:", e);
      setError("An unexpected error occurred during the upload.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <Card className="max-w-md mx-auto mt-10 p-4">
      <CardHeader>
        <CardTitle>Upload Logo to Extract Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Preview */}
        {imagePreviewUrl && (
          <Image
            src={imagePreviewUrl}
            alt="Uploaded Logo Preview"
            width={192}
            height={192}
            className="w-48 h-48 object-contain rounded mx-auto border"
          />
        )}

        {/* File Input */}
        <Input
          type="file"
          accept="image/*"
          // Clear previous file before setting new one to ensure imagePreviewUrl updates if the same file is chosen
          onChange={(e) => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
            setFile(e.target.files?.[0] ?? null);
            setColors([]); // Clear previous results on new file selection
            setError(null);
          }}
          disabled={loading} // Disable input while loading
        />

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full"
        >
          {loading ? "Extracting..." : "Get Palette"}
        </Button>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 font-medium" role="alert">
            🚨 {error}
          </p>
        )}

        {/* Color Palette Display */}
        {colors.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Extracted Palette:</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {colors.map((c) => (
                <div key={c.hex} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-full shadow-lg border-2 border-gray-100"
                    style={{ backgroundColor: c.hex }}
                    title={`Hex: ${c.hex}\nRGB: ${c.rgb.join(
                      ", "
                    )}\nPopulation: ${c.population}`}
                  />
                  <span className="text-xs mt-1 font-mono">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
