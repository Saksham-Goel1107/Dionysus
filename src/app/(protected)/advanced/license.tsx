"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const LICENSE_OPTIONS = [
	{ label: "MIT", value: "mit" },
	{ label: "Apache 2.0", value: "apache-2.0" },
	{ label: "GPL v3", value: "gpl-3.0" },
	{ label: "BSD 3-Clause", value: "bsd-3-clause" },
	{ label: "Unlicense", value: "unlicense" },
	{ label: "Creative Commons Zero (CC0)", value: "cc0" },
	{ label: "Proprietary (All Rights Reserved)", value: "proprietary" },
	{ label: "Strictest No-Copy License", value: "strictest" },
	{ label: "Custom", value: "custom" },
];

const CLAUSES = [
	{ label: "Allow commercial use", key: "commercial" },
	{ label: "Allow modification", key: "modification" },
	{ label: "Allow distribution", key: "distribution" },
	{ label: "Allow private use", key: "private" },
	{ label: "Require attribution", key: "attribution" },
	{ label: "Require same license (copyleft)", key: "copyleft" },
	{ label: "No liability", key: "liability" },
	{ label: "No warranty", key: "warranty" },
	{ label: "No patent use", key: "patent" },
	{ label: "No sublicensing", key: "sublicense" },
	{ label: "No copying of any code or content", key: "no_copy" },
];

const LICENSE_PATHS: Record<string, string> = {
	mit: "/licenses/mit.txt",
	"apache-2.0": "/licenses/apache-2.0.txt",
	"gpl-3.0": "/licenses/gpl-3.0.txt",
	"bsd-3-clause": "/licenses/bsd-3-clause.txt",
	unlicense: "/licenses/unlicense.txt",
	cc0: "/licenses/cc0.txt",
	proprietary: "/licenses/proprietary.txt",
	strictest: "/licenses/strictest.txt",
	custom: "/licenses/custom.txt",
};

const fetchAndFillLicense = async (
	type: string,
	name: string,
	year: number,
	clauses: Record<string, boolean>
) => {
	if (type === "custom") {
		let text = `Custom License Generated:\n`;
		if (clauses.no_copy)
			text += `\nNO COPYING: You may not copy, use, reference, or distribute any part of this codebase.`;
		if (clauses.commercial) text += `\nCOMMERCIAL USE: Allowed.`;
		if (clauses.modification) text += `\nMODIFICATION: Allowed.`;
		if (clauses.distribution) text += `\nDISTRIBUTION: Allowed.`;
		if (clauses.private) text += `\nPRIVATE USE: Allowed.`;
		if (clauses.attribution) text += `\nATTRIBUTION: Required.`;
		if (clauses.copyleft) text += `\nCOPYLEFT: Derivatives must use the same license.`;
		if (clauses.liability) text += `\nNO LIABILITY: The author is not liable for any damages.`;
		if (clauses.warranty) text += `\nNO WARRANTY: The code is provided without warranty.`;
		if (clauses.patent) text += `\nNO PATENT USE: Patent rights are not granted.`;
		if (clauses.sublicense) text += `\nNO SUBLICENSING: You may not sublicense this code.`;
		if (text === "Custom License Generated:\n") text += "\nNo permissions granted.";
		return text;
	}
	const path = LICENSE_PATHS[type];
	if (!path) return "";
	const res = await fetch(path);
	let txt = await res.text();
	txt = txt.replace(/\{year\}/g, year.toString()).replace(/\{name\}/g, name || "[Your Name]");
	return txt;
};

const LicenseMakerPage = () => {
	const [selected, setSelected] = useState("mit");
	const [clauses, setClauses] = useState<Record<string, boolean>>({});
	const [name, setName] = useState("");
	const [copied, setCopied] = useState(false);
	const [licenseText, setLicenseText] = useState("");
	const year = new Date().getFullYear();

	useEffect(() => {
		fetchAndFillLicense(selected, name, year, clauses).then(setLicenseText);
	}, [selected, name, year, clauses]);

	return (
		<div className="w-full max-w-2xl mx-auto my-8 p-6 bg-green-50 dark:bg-green-900/40 rounded-xl border border-green-300 dark:border-green-700 shadow-md flex flex-col items-center">
			<h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-200">
				License Generator
			</h2>
			<div className="w-full flex flex-col gap-4">
				<label className="font-semibold">Your Name (for copyright):</label>
				<input
					type="text"
					className="border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. John Doe or Company Name"
				/>
				<label className="font-semibold">Choose a license type:</label>
				<select
					className="border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
					value={selected}
					onChange={(e) => setSelected(e.target.value)}
				>
					{LICENSE_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				{selected === "custom" && (
					<div className="flex flex-col gap-2 mt-2">
						<label className="font-semibold">Select clauses to include:</label>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{CLAUSES.map((clause) => (
								<label key={clause.key} className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={!!clauses[clause.key]}
										onChange={() =>
											setClauses((prev) => ({
												...prev,
												[clause.key]: !prev[clause.key],
											}))
										}
										className="accent-green-600"
									/>
									<span className="text-xs">{clause.label}</span>
								</label>
							))}
						</div>
					</div>
				)}
				<label className="font-semibold mt-4">Generated License:</label>
				<pre
					className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-xs overflow-x-auto w-full select-all break-all mb-2"
					style={{ minHeight: 200 }}
				>
					{licenseText}
				</pre>
				<Button
					onClick={() => {
						navigator.clipboard.writeText(licenseText);
						setCopied(true);
						setTimeout(() => setCopied(false), 1200);
					}}
					className="bg-green-600 text-white px-3 py-1 text-xs w-full sm:w-auto"
				>
					{copied ? "Copied!" : "Copy License"}
				</Button>
			</div>
		</div>
	);
};

export default LicenseMakerPage;
