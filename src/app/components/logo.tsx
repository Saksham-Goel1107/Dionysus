import Image from 'next/image';

export function Logo() {
  return (
    <div className="relative h-10 w-10 cursor-default">
      <Image
        src="/logo.png"
        width={40}
        height={40}
        alt="Dionysus Logo"
        className="rounded-lg object-contain"
      />
    </div>
  );
}
