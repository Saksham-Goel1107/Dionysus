import TextGenerateEffect from '@/components/ui/typewriter';

export default function GradientTypewriter({ words = "Gradient Text" }: { words?: string }) {
  return (
    <div className="flex items-center justify-center">
      <TextGenerateEffect
        words={words}
        className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-xl font-bold text-transparent"
      />
    </div>
  );
}
