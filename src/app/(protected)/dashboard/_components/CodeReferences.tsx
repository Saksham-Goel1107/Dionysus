"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type Props = {
  filesReferences: {
    fileName: string;
    sourceCode: string;
    summary: string;
  }[];
};

const CodeReferences = ({ filesReferences }: Props) => {
  if (filesReferences.length === 0) return null;

  const [tab, setTab] = React.useState(filesReferences[0]?.fileName);

  return (
    <div className="m-auto max-w-[70vw]">
      <Tabs value={tab} onValueChange={setTab}>
        <ScrollArea className="w-full overflow-auto">
          <div className="flex gap-2 rounded-md bg-gray-200 p-1">
            {filesReferences.map((file) => (
              <button
                onClick={() => setTab(file.fileName)}
                key={file.fileName}
                className={cn(
                  "max-w-[80vw] whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted-foreground hover:text-primary-foreground",
                  {
                    "bg-primary text-primary-foreground": tab === file.fileName,
                  },
                )}
              >
                {file.fileName}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filesReferences.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            className="max-w-7xl rounded-md"
          >
            <div className="max-h-[25vh] w-full overflow-auto">
              <SyntaxHighlighter
                language="typescript"
                style={lucario}
                className="overflow-auto"
              >
                {file.sourceCode}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReferences;
