import Image from "next/image";

export default function BrandMark({
  className = "h-10 w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={542}
      height={640}
      priority={priority}
      className={className}
    />
  );
}
