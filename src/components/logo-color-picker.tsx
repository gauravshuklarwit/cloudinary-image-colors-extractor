"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Color = {
  hex: string;
  percentage: number;
};

export default function LogoColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/extract-colors", { method: "POST", body: formData });
    const data = await res.json();
    setColors(data.colors || []);
    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-10 p-4">
      <CardHeader>
        <CardTitle>Upload Logo to Extract Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={handleUpload} disabled={loading}>
          {loading ? "Extracting..." : "Get Palette"}
        </Button>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {colors.map((c) => (
              <div key={c.hex} className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.hex} (${c.percentage.toFixed(1)}%)`}
                />
                <span className="text-xs">{c.hex}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
