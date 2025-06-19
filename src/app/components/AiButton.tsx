import { useState } from "react";
import Image from "next/image";

export default function AiToolkitButton({ setIsSidebarOpen }: { setIsSidebarOpen: (val: boolean) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  let timeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    timeout = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeout);
    setShowTooltip(false);
  };

  return (
    <div
      className="relative z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsSidebarOpen(true);
          document.body.style.overflow = "hidden";
        }}
        className={`fixed bottom-20 right-4 bg-white  h-12 w-12 p-1 flex items-center justify-center shadow-lg transition-colors rounded-full cursor-pointer`}
        aria-label="Open AI Assistant"
      >
        <Image src="/gemini.png" alt="Gemini" width={30} height={30} />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-[8rem] right-4 flex flex-col items-end space-y-1">
          <div className={`bg-white text-black text-sm px-3 py-1 rounded shadow-md whitespace-nowrap transition-opacity duration-300`}>
            💬 Ask AI
          </div>
        </div>
      )}
    </div>
  );
}
