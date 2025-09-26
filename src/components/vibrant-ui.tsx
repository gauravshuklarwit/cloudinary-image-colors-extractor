"use client";

import { useState, useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Assuming you have a Label component
import Image from "next/image";

type Color = {
  hex: string;
  rgb: number[];
  population: number;
};

export function VibrantUI() {
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🛠️ NEW STATE for Quality Parameters
  const [quality, setQuality] = useState(1); // 1 (Highest) to 10 (Lowest)
  const [maxColorCount, setMaxColorCount] = useState(256); // Max 256 for best accuracy

  const imagePreviewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);
  
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setColors([]); 

    const formData = new FormData();
    formData.append("image", file);
    // 🛠️ NEW: Append quality parameters to the FormData
    formData.append("quality", String(quality));
    formData.append("maxColorCount", String(maxColorCount));

    try {
      const res = await fetch("/api/vibrant", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Failed to extract colors. Status: ${res.status}`);
        return;
      }
      
      const data = await res.json();
      console.log("Extracted Colors:", data.colors);
      setColors(data.colors || []);
    } catch (e) {
      console.error("Upload/Fetch Error:", e);
      setError("An unexpected error occurred during the upload.");
    } finally {
      setLoading(false);
    }
  }, [file, quality, maxColorCount]); // Dependency update

  return (
    <Card className="max-w-xl mx-auto mt-10 p-4">
      <CardHeader>
        <CardTitle>Upload Logo to Extract Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          onChange={(e) => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); 
            setFile(e.target.files?.[0] ?? null);
            setColors([]);
            setError(null);
          }}
          disabled={loading}
        />
        
        {/* 🛠️ NEW: Quality Parameter Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quality">Quality (1=Best, 10=Fastest)</Label>
            <Input
              id="quality"
              type="number"
              min="1"
              max="10"
              value={quality}
              onChange={(e) => setQuality(Math.min(10, Math.max(1, Number(e.target.value))))}
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="maxColorCount">Max Color Count (e.g., 256)</Label>
            <Input
              id="maxColorCount"
              type="number"
              min="16"
              max="256"
              value={maxColorCount}
              onChange={(e) => setMaxColorCount(Math.min(256, Math.max(16, Number(e.target.value))))}
              className="mt-1"
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Upload Button */}
        <Button onClick={handleUpload} disabled={loading || !file} className="w-full">
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
              {colors.map((c,i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-full shadow-lg border-2 border-gray-100"
                    style={{ backgroundColor: `rgb(${c.rgb.join(",")})` }}
                    title={`rgb: ${c.rgb}\nPopulation: ${c.population}`}
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