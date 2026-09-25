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
      alt="The Crude Oracle"
      width={1100}
      height={1227}
      priority={priority}
      className={className}
    />
  );
}
