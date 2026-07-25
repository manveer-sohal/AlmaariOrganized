import Image from "next/image";
import type { SampleImage } from "./sampleImages";

type SampleClothingImageProps = {
  item: SampleImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export default function SampleClothingImage({
  item,
  className = "",
  sizes = "96px",
  priority = false,
}: SampleClothingImageProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white/90 ${className}`}
    >
      <Image
        src={item.src}
        alt={item.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-0.5"
      />
    </div>
  );
}
