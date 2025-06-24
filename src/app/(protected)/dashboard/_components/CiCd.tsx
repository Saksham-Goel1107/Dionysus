"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Download,
  Copy,
  Wrench,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Info,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PROVIDERS = [
  {
    name: "GitHub Actions",
    value: "github",
    template: ({ steps, env }: { steps: string; env: string }) =>
      `name: CI Workflow\n\non: [push, pull_request]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    env:${env ? `\n${env}` : ""}\n    steps:\n      - uses: actions/checkout@v4\n${steps}`,
  },
  {
    name: "GitLab CI",
    value: "gitlab",
    template: ({ steps, env }: { steps: string; env: string }) =>
      `${env ? `${env}\n` : ""}stages:\n  - build\n\nbuild-job:\n  stage: build\n  script:${steps}`,
  },
  {
    name: "CircleCI",
    value: "circleci",
    template: ({ steps, env }: { steps: string; env: string }) =>
      `version: 2.1\njobs:\n  build:\n    docker:\n      - image: cimg/node:18.20\n    environment:${env ? `\n${env}` : ""}\n    steps:${steps}`,
  },
];

const OS_OPTIONS = [
  { label: "Ubuntu Latest", value: "ubuntu-latest" },
  { label: "Windows Latest", value: "windows-latest" },
  { label: "macOS Latest", value: "macos-latest" },
];

const NODE_VERSIONS = ["18", "20", "22"];

const DEFAULT_STEPS = [
  {
    label: "Install dependencies",
    value: "install",
    checked: true,
    custom: false,
    script: "npm ci",
  },
  {
    label: "Build",
    value: "build",
    checked: true,
    custom: false,
    script: "npm run build",
  },
  {
    label: "Test",
    value: "test",
    checked: true,
    custom: false,
    script: "npm test",
  },
  {
    label: "Deploy",
    value: "deploy",
    checked: false,
    custom: false,
    script: "npm run deploy",
  },
];

const TIPS = [
  "Use caching to speed up your builds (e.g., actions/cache for node_modules).",
  "Run tests in parallel using matrix builds for different Node versions.",
  "Store secrets securely using your CI provider's secret manager.",
  "Keep your workflows DRY by using reusable workflows or templates.",
  "Add status badges to your README for visibility.",
  "Use notifications (Slack, Email) for failed builds.",
];

function getStepsYaml(provider: string, steps: any[]) {
  if (provider === "github") {
    return steps
      .map((step) => `      - name: ${step.label}\n        run: ${step.script}`)
      .join("\n");
  }
  if (provider === "gitlab") {
    return steps.map((step) => `    - ${step.script}`).join("\n");
  }
  if (provider === "circleci") {
    return steps.map((step) => `      - run: ${step.script}`).join("\n");
  }
  return "";
}

function getEnvYaml(provider: string, envVars: string) {
  if (!envVars.trim()) return "";
  if (provider === "github" || provider === "circleci") {
    return envVars
      .split("\n")
      .map((line: string) => `      ${line}`)
      .join("\n");
  }
  if (provider === "gitlab") {
    return envVars
      .split("\n")
      .map((line) => `${line}`)
      .join("\n");
  }
  return "";
}

const CiCd = () => {
  const { resolvedTheme } = useTheme();
  const [provider, setProvider] = useState("github");
  const [os, setOs] = useState(OS_OPTIONS[0]?.value ?? "");
  const [nodeVersion, setNodeVersion] = useState(NODE_VERSIONS[0]);
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [envVars, setEnvVars] = useState("");
  const [yaml, setYaml] = useState("");
  const [aiTip, setAiTip] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [hasProPlan, sethasProPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  interface Step {
    label: string;
    value: string;
    checked: boolean;
    custom: boolean;
    script: string;
  }

  const handleStepChange = (idx: number) => {
    setSteps((prev: Step[]) =>
      prev.map((step: Step, i: number) =>
        i === idx ? { ...step, checked: !step.checked } : step,
      ),
    );
  };

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        label: "Custom Step",
        value: `custom${prev.length + 1}`,
        checked: true,
        custom: true,
        script: "echo 'Custom script'",
      },
    ]);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStepLabelChange = (idx: number, label: string) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === idx ? { ...step, label } : step)),
    );
  };

  const handleStepScriptChange = (idx: number, script: string) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === idx ? { ...step, script } : step)),
    );
  };

  const handleMoveStep = (idx: number, dir: number) => {
    setSteps((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(idx, 1);
      if (removed !== undefined) {
        arr.splice(idx + dir, 0, removed);
      }
      return arr;
    });
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const prompt = `Suggest advanced CI/CD YAML for a ${provider} pipeline with steps: ${steps
        .filter((s) => s.checked)
        .map((s) => s.label)
        .join(
          ", ",
        )}, OS: ${os}, Node: ${nodeVersion}, env: ${envVars}. Give a tip for best practices.`;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        setAiTip("AI request failed. Please try again.");
        setAiLoading(false);
        return;
      }
      const result = await res.json();
      if (typeof result === "string") {
        setAiTip(result);
      } else {
        setAiTip(result.tip || "");
        if (result.yaml) setYaml(result.yaml);
      }
    } catch (err) {
      setAiTip("AI request failed. Please check your connection or try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerate = () => {
    const selectedSteps = steps.filter((s) => s.checked);
    const stepsYaml = getStepsYaml(provider, selectedSteps);
    const envYaml = getEnvYaml(provider, envVars);
    const providerObj = PROVIDERS.find((p) => p.value === provider);
    if (!providerObj) {
      setYaml("");
      return;
    }
    let template = providerObj.template;
    let finalYaml = template({ steps: stepsYaml, env: envYaml });
    // Add OS and Node version for GitHub Actions
    if (provider === "github") {
      finalYaml = finalYaml.replace(
        /runs-on: [^\n]+/,
        `runs-on: ${os}\n    strategy:\n      matrix:\n        node-version: [${nodeVersion}]`,
      );
      // Insert Node.js setup step after checkout
      finalYaml = finalYaml.replace(
        /(- uses: actions\/checkout@v4)/,
        `$1\n      - name: Use Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: \${{ matrix.node-version }}`,
      );
    }
    setYaml(finalYaml);
  };

  const handleCopy = async () => {
    if (yaml) {
      await navigator.clipboard.writeText(yaml);
      alert("✅ YAML copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (!yaml) return;
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${provider}-ci-cd.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/pro-status");
        if (!res.ok) throw new Error("Failed to fetch pro status");
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch (error) {
        sethasProPlan(false);
      }finally{
        setLoading(false)
      }
    })();
  }, []);

   if (loading) {
            return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500 dark:text-gray-300" />
                <p className="text-gray-500 dark:text-gray-300 text-lg">Checking your plan...</p>
              </div>
            );
          }


  return (
    <>
      {!hasProPlan ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2
            className={`text-center text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}
          >
            Pro Plan Required
          </h2>
          <p
            className={`text-center ${resolvedTheme === "dark" ? "text-gray-200" : "text-gray-600"} max-w-md`}
          >
            Access to Ci/Cd genrator is available exclusively for{" "}
            <span className="font-semibold text-yellow-700">
              Dionysus Pro Pack
            </span>{" "}
            subscribers.
            <br />
            Upgrade your plan to unlock this feature.
          </p>
          <Link href="/subscriptions">
            <Button
              size="lg"
              className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </Link>
        </div>
      ) : (
        <div
          className={`mx-auto max-w-2xl rounded-xl border p-6 shadow-xl transition duration-300 ${
            resolvedTheme === "dark"
              ? "border-zinc-700 bg-zinc-900 text-white"
              : "border-gray-200 bg-white text-gray-800"
          }`}
        >
          <h2 className="mb-4 flex items-center gap-2 text-3xl font-bold">
            <Wrench className="h-6 w-6 text-blue-500" /> CI/CD Pipeline
            Generator
            <Button
              onClick={handleAiSuggest}
              className="ml-auto flex items-center gap-1"
              variant="outline"
              size="sm"
              disabled={aiLoading === true ? true : false}
            >
              <Sparkles className="h-4 w-4 text-purple-500" /> AI Suggest
            </Button>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 mt-4 block font-semibold">
                CI Provider:
              </label>
              <select
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 mt-4 block font-semibold">OS:</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={os}
                onChange={(e) => setOs(e.target.value)}
              >
                {OS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 mt-4 block font-semibold">
                Node Version:
              </label>
              <select
                className="w-full rounded border px-3 py-2"
                value={nodeVersion}
                onChange={(e) => setNodeVersion(e.target.value)}
              >
                {NODE_VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mb-2 mt-6 block font-semibold">Steps:</label>
          <div className="flex flex-col gap-2">
            {steps.map((step, idx) => (
              <div key={step.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={step.checked}
                  onChange={() => handleStepChange(idx)}
                  className="accent-blue-600"
                />
                <input
                  type="text"
                  value={step.label}
                  onChange={(e) => handleStepLabelChange(idx, e.target.value)}
                  className="w-40 rounded border px-2 py-1"
                />
                <input
                  type="text"
                  value={step.script}
                  onChange={(e) => handleStepScriptChange(idx, e.target.value)}
                  className="w-64 rounded border px-2 py-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMoveStep(idx, -1)}
                  disabled={idx === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMoveStep(idx, 1)}
                  disabled={idx === steps.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveStep(idx)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button
              onClick={handleAddStep}
              className="mt-2 flex items-center gap-2"
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4" /> Add Step
            </Button>
          </div>

          <label className="mb-2 mt-6 block font-semibold">
            Environment Variables{" "}
            <span className="text-sm font-normal">(e.g. FOO=bar)</span>:
          </label>
          <textarea
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="NODE_ENV=production\nAPI_KEY=your-key"
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
          />

          <Button
            onClick={handleGenerate}
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110"
          >
            Generate YAML
          </Button>

          {yaml && (
            <div className="mt-6">
              <label className="mb-2 block font-semibold">
                Generated YAML:
              </label>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
                {yaml}
              </pre>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
              <Info className="h-5 w-5 text-blue-400" /> Tips & Tricks
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              {TIPS.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
              {aiTip && (
                <li className="font-semibold text-purple-500">💡 {aiTip}</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default CiCd;
