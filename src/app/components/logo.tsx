import Image from 'next/image';

export function Logo() {
  return (
    <div className="relative h-10 w-10 cursor-default">
      <Image
        src="/logo.png"
        alt="Dionysus Logo"
        fill
        className="rounded-lg object-contain"
        priority
      />
    </div>
  );
}
