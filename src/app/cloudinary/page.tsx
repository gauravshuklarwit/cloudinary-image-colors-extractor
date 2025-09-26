import CloudinaryUI from "@/components/cloudinary-ui";

export default function Page() {
  return (
    <main>
      <div className="container mx-auto px-5">
        <div className="text-center my-10 space-y-3">
          <h1 className="text-3xl font-bold">Image Color Extractor</h1>
          <p className="text-sm text-pretty">
            Using <span className="font-bold">Cloudinary API</span> to extract
            colors from logo images.
          </p>
        </div>
        <CloudinaryUI />
      </div>
    </main>
  );
}
