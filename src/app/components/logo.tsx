import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Dionysus Logo"
      width={40}
      height={40}
      className="rounded-lg object-contain"
      priority
    />
  );
}
