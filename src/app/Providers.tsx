"use client";

import { useState } from "react"; 
import AiChatSidebar from "./components/AiChatSidebar";
import AiToolkitButton from "./components/AiButton";


function Providers({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {children}
      <AiToolkitButton setIsSidebarOpen={setIsSidebarOpen} />
      <AiChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          document.body.style.overflow = "";
        }}
      />
    </>
  );
}

export default Providers;
