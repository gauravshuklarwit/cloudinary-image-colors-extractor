import { VibrantUI } from "@/components/vibrant-ui";

export default function Page() {
  return (
    <main>
      <div className="container mx-auto px-5">
        <div className="text-center my-10 space-y-3">
          <h1 className="text-3xl font-bold">Image Colors Extractor</h1>
          <p className="text-sm text-pretty">
            Using <span className="font-bold">Node Vibrant</span> to extract
            colors from logo images.
          </p>
        </div>
        <VibrantUI />
      </div>
    </main>
  );
}
