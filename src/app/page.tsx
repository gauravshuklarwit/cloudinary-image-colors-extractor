import LogoColorPicker from "@/components/logo-color-picker";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto px-5">
        <div className="text-center my-10 space-y-3">
          <h1 className="text-3xl font-bold">Image Color Extractor</h1>
          <p className="text-sm text-pretty">Using Cloudinary API to extract colors from logo images.</p>
        </div>
        <LogoColorPicker />
      </div>
    </main>
  );
}
