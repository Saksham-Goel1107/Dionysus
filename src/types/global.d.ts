// Global type declarations for external libraries

declare global {
  interface Window {
    google?: {
      search?: {
        cse?: {
          element?: {
            render: (options: { div: string; tag: string }) => void;
          };
        };
      };
    };
  }
}

export {};
