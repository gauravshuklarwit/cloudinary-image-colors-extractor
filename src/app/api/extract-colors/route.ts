import { NextRequest, NextResponse } from "next/server";

// Define the expected response structure from Cloudinary
interface CloudinaryUploadResponse {
  public_id: string;
  // ... other properties
}

interface CloudinaryResourceResponse {
  colors: [string, number][]; // e.g., [["#FFFFFF", 80.5], ["#000000", 19.5]]
  // ... other properties
}

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Prepare data for the initial upload
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("upload_preset", "alamo Tees"); // 💡 Use an unsigned preset for simplicity and security on the client-side/serverless env

    // 1. Upload the image to Cloudinary
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Cloudinary upload error:", errText);
      return NextResponse.json(
        { error: "Cloudinary upload failed", details: errText },
        { status: uploadRes.status }
      );
    }

    const uploaded = (await uploadRes.json()) as CloudinaryUploadResponse;
    const publicId = uploaded.public_id;

    // 2. Fetch resource details with color data using the Admin API
    const auth = Buffer.from(
      `${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`
    ).toString("base64");

    const resourceRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}?colors=true`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!resourceRes.ok) {
      const errText = await resourceRes.text();
      console.error("Cloudinary palette error:", errText);
      return NextResponse.json(
        { error: "Failed to fetch color palette", details: errText },
        { status: resourceRes.status }
      );
    }

    const resourceData =
      (await resourceRes.json()) as CloudinaryResourceResponse;

    // Format the colors to match your frontend's expectation
    const colors = resourceData.colors.map(([hex, percentage]) => ({
      hex,
      percentage: (percentage / file.size) * 10000, // Cloudinary provides a score, not a direct percentage. This is an approximation.
    }));

    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to extract colors" },
      { status: 500 }
    );
  }
}
