import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto px-5">
        <div className="space-y-3 text-center my-10">
          <h1 className="text-3xl font-bold">Image Color Extractor</h1>
          <p className="text-sm text-pretty">
            Click on one of the solutions below:
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Button asChild>
              <Link href="/cloudinary">Using Cloudinary API</Link>
            </Button>
            <Button asChild>
              <Link href="/vibrant">Using Vibrant.js/Node Vibrant</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
