import Image from "next/image";

export default function BrandMark({
  className = "h-10 w-auto",
  priority = false,
  sizes = "128px",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src="/logo.webp"
      alt="The Crude Oracle"
      width={256}
      height={286}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
