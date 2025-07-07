'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import CryptoJS from 'crypto-js';
import { useUser } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { myAction } from '../Settings/actions';
import { useReverification } from '@clerk/nextjs';

export default function MyDataPage() {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [decryptedData, setDecryptedData] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; firstName: string } | null>(null);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exportConfirmText, setExportConfirmText] = useState('');
  const [showDecrypted, setShowDecrypted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verified, setVerified] = useState(false);
  const performAction = useReverification(myAction);

  const handleClick = async () => {
    const myData = await performAction();
    if (!myData) return;
    setVerified(true);
    doExport();
  };

  const handleFetchUserInfo = () => {
    if (!isLoaded || !user) {
      toast.error('User info not loaded. Please try again.');
      return;
    }
    if (!user.emailAddresses?.[0]?.emailAddress || !user.firstName) {
      toast.error('Missing email or first name in your profile.');
      return;
    }
    setUserInfo({
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
    });
    setStep(2);
  };

  // Step 2: Export handler
  const handleExportData = async () => {
    if (!userInfo) {
      toast.error('Please fetch your info first.');
      return;
    }
    setExportConfirmOpen(true);
  };

  const doExport = async () => {
    
    setIsExporting(true);
    setExportConfirmOpen(false);
    const res = await fetch('/api/export-user-data');
    if (!res.ok) {
      toast.error('Failed to export data.');
      setIsExporting(false);
      return;
    }
    const data = await res.json();
    if (!userInfo) {
      toast.error('User info is missing.');
      setIsExporting(false);
      return;
    }
    const password = userInfo.email + userInfo.firstName;
    const jsonString = JSON.stringify(data, null, 2);
    const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
    const zip = new JSZip();
    zip.file('Dionysus-data.json.aes', encrypted);
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'Encrypted-Dionysus-data.zip');
    toast.success('Your data has been exported and password-protected.');
    setIsExporting(false);
    setStep(3);
  };

  // Step 3: Decrypt handler
  const handleDecryptData = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDecryptError(null);
    setDecryptedData(null);
    setDecrypting(true);
    try {
      const form = e.target as HTMLFormElement;
      const fileInput = form.elements.namedItem('zipFile') as HTMLInputElement;
      const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        setDecryptError('Please select your exported zip file.');
        setDecrypting(false);
        return;
      }
      const file = fileInput.files[0];
      const password = passwordInput.value;
      if (!password) {
        setDecryptError('Please enter your password.');
        setDecrypting(false);
        return;
      }
      const zip = await JSZip.loadAsync(file as File);
      const encryptedFile = zip.file('Dionysus-data.json.aes');
      if (!encryptedFile) {
        setDecryptError('Encrypted data file not found in zip.');
        setDecrypting(false);
        return;
      }
      const encryptedContent = await encryptedFile.async('string');
      let decrypted;
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedContent, password);
        decrypted = bytes.toString(CryptoJS.enc.Utf8);
      } catch (err) {
        setDecryptError('Failed to decrypt. Check your password.');
        setDecrypting(false);
        return;
      }
      if (!decrypted) {
        setDecryptError('Failed to decrypt. Check your password.');
        setDecrypting(false);
        return;
      }
      setDecryptedData(decrypted);
      setShowDecrypted(false);
    } catch (err) {
      setDecryptError('An error occurred during decryption.');
    }
    setDecrypting(false);
  };

  // Stepper UI
  const steps = [
    { label: 'Password Guide', icon: '🔑' },
    { label: 'Export Data', icon: '⬇️' },
    { label: 'Decrypt Data', icon: '🔓' },
  ];

  // Password hint for copy
  const passwordHint = userInfo ? userInfo.email + userInfo.firstName : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Dialog open={exportConfirmOpen} onOpenChange={setExportConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="text-lg font-semibold mb-2">Confirm Data Export</div>
          </DialogHeader>
          <p className="mb-2 text-sm">
            For your security, please type{' '}
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1">CONFIRM EXPORT</span>{' '}
            below to proceed. You may also be prompted to re-verify yourself before exporting you data.
          </p>
          <input
            className="border p-2 rounded w-full mb-2"
            value={exportConfirmText}
            onChange={(e) => setExportConfirmText(e.target.value)}
            placeholder="Type CONFIRM EXPORT"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setExportConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (exportConfirmText === 'CONFIRM EXPORT') {
                  setExportConfirmText('');
                  handleClick();
                } else {
                  toast.error('You must type CONFIRM EXPORT exactly.');
                }
              }}
              disabled={exportConfirmText !== 'CONFIRM EXPORT'}
            >
              Confirm & Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-blue-200 dark:border-blue-800 relative">
        {/* Stepper */}
        <div className="flex justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className={`flex flex-col items-center ${step === i + 1 ? 'scale-110' : ''}`}>
                <div
                  className={`rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold ${step >= i + 1 ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}
                >
                  {s.icon}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold ${step >= i + 1 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400'}`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-1 mx-2 rounded-full ${step > i + 1 ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-gray-200 dark:bg-gray-800'}`}
                ></div>
              )}
            </div>
          ))}
        </div>
        {/* Tips & Tricks */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 border border-green-200 dark:border-green-700 shadow flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-base">
            <span>💡</span>Tips & Tricks
          </div>
          <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 ml-2">
            <li>
              You can decrypt any previously exported data at any time, even if you exported it on a
              different device.
            </li>
            <li>
              Your password is always <b>email + firstName</b> (case-sensitive, no spaces).
            </li>
            <li>Keep your exported zip file safe. Only you can decrypt it.</li>
            <li>If you change your email or first name, use the info from the time of export.</li>
            <li>Need help? Contact support or check the FAQ.</li>
          </ul>
        </div>
        {/* Step 1: Password Guide (always accessible) */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span>🔑</span>Password Guide
          </h2>
          <p className="mb-2 text-gray-700 dark:text-gray-300 text-sm">
            To decrypt your exported data, you will need a password. It is a combination of your
            email and first name (case-sensitive, no spaces).
          </p>
          <Button className="mb-4" onClick={handleFetchUserInfo} disabled={!isLoaded || !user}>
            Fetch My Info
          </Button>
          {userInfo && (
            <div className="mt-2 text-xs bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <span className="font-semibold text-blue-700 dark:text-blue-300">Email:</span>
                <RevealField value={userInfo.email} label="Show Email" />
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  First Name:
                </span>
                <RevealField value={userInfo.firstName} label="Show First Name" />
              </div>
              <div className="flex gap-2 items-center mt-2">
                <span className="font-semibold text-green-700 dark:text-green-300">Password:</span>
                <span className="font-mono bg-green-50 dark:bg-green-900 px-2 py-1 rounded">
                  email + firstName
                </span>
                <span>Like: xyz@example.comNAME</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Check spelling and capitalization. If your name/email is wrong, you would not be
                able to decrypt your data.
              </div>
            </div>
          )}
        </div>
        {/* Step 2: Export Data (always accessible) */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span>⬇️</span>Export Your Data
          </h2>
          <p className="mb-2 text-gray-700 dark:text-gray-300 text-sm">
            Export your data securely. The exported file will be encrypted and password-protected.
          </p>
          <Button onClick={handleExportData} disabled={isExporting} className="w-full max-w-xs">
            {isExporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </div>
        {/* Step 3: Decrypt Data (always accessible) */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span>🔓</span>Decrypt Your Data
          </h2>
          <p className="mb-2 text-gray-700 dark:text-gray-300 text-sm">
            Upload your exported zip file and enter your password to decrypt your data. You can do
            this at any time, even if you exported your data previously.
          </p>
          <form className="w-full flex flex-col gap-4" onSubmit={handleDecryptData}>
            <label className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Exported Zip File
            </label>
            <input
              type="file"
              name="zipFile"
              accept=".zip"
              required
              className="border p-3 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-400 transition text-base font-medium"
              ref={fileInputRef}
            />
            <label className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              Password
            </label>
            <div className="flex items-center gap-2 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password (email+firstName)"
                required
                className="border p-3 rounded-lg flex-1 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-400 text-base font-mono tracking-wide transition placeholder:italic placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
                autoComplete="off"
              />
              <label className="text-xs flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />{' '}
                Show
              </label>
            </div>
            <Button
              type="submit"
              className="w-full max-w-xs text-lg font-bold py-3 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition text-white rounded-lg shadow-lg"
              disabled={decrypting}
            >
              {decrypting ? 'Decrypting...' : 'Decrypt'}
            </Button>
            {decryptError && (
              <div className="text-red-500 text-xs text-center font-semibold mt-1">
                {decryptError}
              </div>
            )}
          </form>
          {decryptedData && (
            <div className="mt-8 w-full flex flex-col items-center">
              {!showDecrypted ? (
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-purple-200 dark:from-gray-700 dark:to-gray-900 p-8 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-2xl max-w-full">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🎉</span>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-200">
                      Decryption Successful
                    </span>
                    <span className="text-base text-gray-700 dark:text-gray-200 text-center">
                      For your privacy, your data is hidden until you confirm.
                    </span>
                  </div>
                  <Button
                    onClick={() => setShowDecrypted(true)}
                    className="mt-6 px-8 py-3 text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                  >
                    Show My Data
                  </Button>
                </div>
              ) : (
                <div
                  className="relative w-full max-w-full max-h-96 overflow-auto bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-8 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-2xl select-none"
                  style={{
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    minHeight: '12rem',
                    maxHeight: '28rem',
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  tabIndex={-1}
                >
                  <pre
                    className="whitespace-pre-wrap break-all font-mono text-blue-900 dark:text-blue-200 text-base leading-relaxed"
                    style={{ margin: 0 }}
                  >
                    {decryptedData}
                  </pre>
                  <div className="absolute top-0 right-0 px-4 py-1 text-xs text-blue-500 bg-white/80 dark:bg-gray-900/80 rounded-bl shadow">
                    Scroll to view all
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 text-center mt-8">
          Your data is encrypted with a password only you know. For maximum privacy, remember:{' '}
          <b>password = email + firstName</b> (case-sensitive, no spaces).
        </div>
      </div>
    </div>
  );
}

function RevealField({ value, label }: { value: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="px-2 py-1 text-xs border-blue-300 dark:border-blue-700"
        onClick={() => setShow((v) => !v)}
      >
        {show ? value : label}
      </Button>
    </span>
  );
}
