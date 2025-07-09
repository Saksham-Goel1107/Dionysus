'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LICENSE_OPTIONS = [
  { label: 'MIT', value: 'mit' },
  { label: 'Apache 2.0', value: 'apache-2.0' },
  { label: 'GPL v3', value: 'gpl-3.0' },
  { label: 'BSD 3-Clause', value: 'bsd-3-clause' },
  { label: 'Unlicense', value: 'unlicense' },
  { label: 'Creative Commons Zero (CC0)', value: 'cc0' },
  { label: 'Proprietary (All Rights Reserved)', value: 'proprietary' },
  { label: 'Strictest No-Copy License', value: 'strictest' },
  { label: 'Custom', value: 'custom' },
];

const CLAUSES = [
  { label: 'Allow commercial use', key: 'commercial' },
  { label: 'Allow modification', key: 'modification' },
  { label: 'Allow distribution', key: 'distribution' },
  { label: 'Allow private use', key: 'private' },
  { label: 'Require attribution', key: 'attribution' },
  { label: 'Require same license (copyleft)', key: 'copyleft' },
  { label: 'No liability', key: 'liability' },
  { label: 'No warranty', key: 'warranty' },
  { label: 'No patent use', key: 'patent' },
  { label: 'No sublicensing', key: 'sublicense' },
  { label: 'No copying of any code or content', key: 'no_copy' },
];

const LICENSE_PATHS: Record<string, string> = {
  mit: '/licenses/mit.txt',
  'apache-2.0': '/licenses/apache-2.0.txt',
  'gpl-3.0': '/licenses/gpl-3.0.txt',
  'bsd-3-clause': '/licenses/bsd-3-clause.txt',
  unlicense: '/licenses/unlicense.txt',
  cc0: '/licenses/cc0.txt',
  proprietary: '/licenses/proprietary.txt',
  strictest: '/licenses/strictest.txt',
  custom: '/licenses/custom.txt',
};

const fetchAndFillLicense = async (
  type: string,
  name: string,
  year: number,
  clauses: Record<string, boolean>,
) => {
  if (type === 'custom') {
    let text = `# Custom Software License\n`;
    text += `\n**Copyright (c) ${year} ${name || '[Your Name]'}**\n`;
    text += `\n---\n`;
    text += `\nThis license governs the use, copying, modification, distribution, and other activities related to the software (the \"Software\") provided herein. By using the Software, you agree to the terms and conditions set forth below.\n`;
    text += `\n## Definitions\n- \"Software\": The code, documentation, and all associated files provided under this license.\n- \"You\": Any individual or entity using, copying, modifying, or distributing the Software.\n`;
    text += `\n## Terms and Conditions\n`;
    const details: string[] = [];
    if (clauses.no_copy)
      details.push(
        `### 1. No Copying\nYou may **not** copy, use, reference, or distribute any part of the Software in any form, including source, binary, or derivative works, except as expressly permitted by this license.`,
      );
    if (clauses.commercial)
      details.push(
        `### 2. Commercial Use\nSubject to the terms of this license, commercial use of the Software is **permitted**.`,
      );
    if (clauses.modification)
      details.push(
        `### 3. Modification\nYou are **permitted** to modify the Software for any lawful purpose. Modified versions must retain this license and all copyright notices.`,
      );
    if (clauses.distribution)
      details.push(
        `### 4. Distribution\nYou are **permitted** to distribute copies or modified versions of the Software, provided you include a copy of this license and clearly indicate any changes made.`,
      );
    if (clauses.private)
      details.push(
        `### 5. Private Use\nPrivate use of the Software is **permitted** without restriction.`,
      );
    if (clauses.attribution)
      details.push(
        `### 6. Attribution\nYou **must** give appropriate credit, provide a link to this license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.`,
      );
    if (clauses.copyleft)
      details.push(
        `### 7. Copyleft (Same License)\nIf you distribute derivative works, you **must** license them under the same terms as this license.`,
      );
    if (clauses.liability)
      details.push(
        `### 8. No Liability\nThe Software is provided "as is", without warranty of any kind, express or implied. In no event shall the author or copyright holder be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use or other dealings in the Software.`,
      );
    if (clauses.warranty)
      details.push(
        `### 9. No Warranty\nThere is **no warranty** for the Software. The entire risk as to the quality and performance of the Software is with you.`,
      );
    if (clauses.patent)
      details.push(
        `### 10. No Patent Use\nThis license does **not** grant you any rights to use any patents held by the author or contributors.`,
      );
    if (clauses.sublicense)
      details.push(
        `### 11. No Sublicensing\nYou may **not** sublicense, assign, or transfer your rights under this license.`,
      );
    if (details.length === 0) {
      text += `\n_No permissions granted. You may not use, copy, modify, or distribute this Software._`;
    } else {
      text += details.join('\n\n');
    }
    text += `\n\n---\n`;
    text += `\n*This license was generated using the Custom License Generator. You may modify or expand it as needed for your project. This is not a substitute for professional legal advice.*`;
    return text;
  }
  const path = LICENSE_PATHS[type];
  if (!path) return '';
  const res = await fetch(path);
  let txt = await res.text();
  txt = txt.replace(/\{year\}/g, year.toString()).replace(/\{name\}/g, name || '[Your Name]');
  return txt;
};

const LicenseMakerPage = () => {
  const [selected, setSelected] = useState('mit');
  const [clauses, setClauses] = useState<Record<string, boolean>>({});
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [licenseText, setLicenseText] = useState('');
  const [preview, setPreview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // Modal state
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
        {selected === 'custom' && (
          <div className="flex flex-col gap-2 mt-2">
            <label className="font-semibold flex items-center gap-2">
              Select clauses to include:
              <Button
                onClick={() => {
                  const allSelected = CLAUSES.every((c) => clauses[c.key]);
                  if (allSelected) {
                    // Deselect all
                    const cleared: Record<string, boolean> = {};
                    setClauses(cleared);
                  } else {
                    // Select all
                    const all: Record<string, boolean> = {};
                    CLAUSES.forEach((c) => {
                      all[c.key] = true;
                    });
                    setClauses(all);
                  }
                }}
                variant="outline"
                className="text-xs px-2 py-1 ml-2"
              >
                {CLAUSES.every((c) => clauses[c.key]) ? 'Deselect All' : 'Select All'}
              </Button>
            </label>
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
        <Button
          onClick={() => setModalOpen(true)}
          variant="default"
          className="bg-blue-500 text-white px-3 py-1 text-xs w-full sm:w-auto"
        >
          Show License
        </Button>
        {/* Modal for license code/preview */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-[#22272e] rounded-lg shadow-lg max-w-2xl w-full p-6 relative border border-green-300 dark:border-green-700 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-lg font-bold"
                aria-label="Close"
              >
                &times;
              </button>
              <div className="flex gap-2 mb-2">
                <Button
                  onClick={() => setPreview(false)}
                  variant={preview ? 'outline' : 'default'}
                  className="text-xs px-2 py-1"
                >
                  Raw
                </Button>
                <Button
                  onClick={() => setPreview(true)}
                  variant={preview ? 'default' : 'outline'}
                  className="text-xs px-2 py-1"
                >
                  Preview
                </Button>
              </div>
              {preview ? (
                <div
                  className="rounded-lg p-8 overflow-x-auto w-full min-h-[220px] border border-gray-200 dark:border-gray-700 shadow-sm prose prose-lg prose-neutral max-w-none dark:prose-invert transition-colors duration-200"
                  style={{ fontFamily: 'system-ui, Segoe UI, Arial, sans-serif' }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{licenseText}</ReactMarkdown>
                </div>
              ) : (
                <pre
                  className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-xs overflow-x-auto w-full select-all break-all mb-2"
                  style={{ minHeight: 200 }}
                >
                  {licenseText}
                </pre>
              )}
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(licenseText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="bg-blue-500 text-white px-3 py-1 text-xs w-full sm:w-auto mt-4"
              >
                {copied ? 'Copied!' : 'Copy License'}
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([licenseText], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'LICENSE.md';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-500 text-white px-3 py-1 text-xs w-full sm:w-auto mt-2 ml-2"
              >
                Download License
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseMakerPage;
