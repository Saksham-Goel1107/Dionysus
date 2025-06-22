"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, PieChart, FileText } from "lucide-react";
import CommitLog from "./CommitLog";
import ContributionChart from "./ContributionChart";
import ReadmeGeneratorFormWrapper from "./readme-generator/ReadmeGeneratorFormWrapper";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type Props = {};

const CommitTabs = ({}: Props) => {
  const [activeTab, setActiveTab] = useState("commits");
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full">      <Tabs 
        defaultValue="commits" 
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${resolvedTheme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
            Project Activity
          </h2>          <TabsList className="grid grid-cols-3 w-[450px] h-10 items-center">
            <TabsTrigger 
              value="commits"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 h-full",
                activeTab === "commits" && "font-medium"
              )}
            >
              <Clock className="h-4 w-4" />
              <span>Commits</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contributions"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 h-full",
                activeTab === "contributions" && "font-medium"
              )}
            >
              <PieChart className="h-4 w-4" />
              <span>Contributions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="readme"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 h-full",
                activeTab === "readme" && "font-medium"
              )}
            >
              <FileText className="h-4 w-4" />
              <span>README</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="commits" className="space-y-4">
          <CommitLog />
        </TabsContent>
          <TabsContent value="contributions" className="space-y-4">
          <div className={cn(
            "rounded-lg p-4 overflow-hidden",
            resolvedTheme === "dark" ? "bg-gray-900/50" : "bg-white"
          )}>
            <ContributionChart />
          </div>
        </TabsContent>

        <TabsContent value="readme" className="space-y-4">
          <div className={cn(
            "overflow-hidden",
            resolvedTheme === "dark" ? "bg-gray-900/50" : "bg-white"
          )}>
            <ReadmeGeneratorFormWrapper />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommitTabs;
