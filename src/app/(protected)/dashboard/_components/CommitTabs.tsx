"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, PieChart, FileText } from "lucide-react";
import CommitLog from "./CommitLog";
import ContributionChart from "./ContributionChart";
import ReadmeGeneratorForm from "./readme-generator/ReadmeGeneratorForm";
import Code from './Code'
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type Props = {};

const CommitTabs = ({}: Props) => {
  const [activeTab, setActiveTab] = useState("commits");
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full">
      <Tabs
      defaultValue="commits"
      onValueChange={(value) => setActiveTab(value)}
      className="w-full"
      >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-semibold ${resolvedTheme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
        Project Activity
        </h2>
        {/* Change grid-cols-3 to grid-cols-4 to fit 4 buttons in a row */}
        <TabsList className="grid grid-cols-4 w-[600px] h-10 items-center">
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
        <TabsTrigger
          value="Code"
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 h-full",
            activeTab === "Code" && "font-medium"
          )}
        >
          
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>Code</span>
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
        <ReadmeGeneratorForm />
        </div>
      </TabsContent>
      <TabsContent value="Code" className="space-y-4">
        <div className={cn(
        "overflow-hidden",
        resolvedTheme === "dark" ? "bg-gray-900/50" : "bg-white"
        )}>
        <Code />
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommitTabs;
