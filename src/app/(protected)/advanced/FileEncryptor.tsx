'use client';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Key, Lock, Unlock, Save, Info, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FileEncryptor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('encrypt');

  // Encrypt states
  const [encryptFile, setEncryptFile] = useState<File | null>(null);
  const [encryptPassword, setEncryptPassword] = useState<string>('');
  const [encryptError, setEncryptError] = useState<string | null>(null);
  const [encryptSuccess, setEncryptSuccess] = useState<boolean>(false);
  const [encryptedUrl, setEncryptedUrl] = useState<string | null>(null);
  const [encryptLoading, setEncryptLoading] = useState<boolean>(false);

  // Decrypt states
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptPassword, setDecryptPassword] = useState<string>('');
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decryptSuccess, setDecryptSuccess] = useState<boolean>(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decryptLoading, setDecryptLoading] = useState<boolean>(false);
  const [decryptedFileName, setDecryptedFileName] = useState<string>('decrypted-file');

  // Refs for file input
  const encryptInputRef = useRef<HTMLInputElement>(null);
  const decryptInputRef = useRef<HTMLInputElement>(null);

  // Handle encrypt file change
  const handleEncryptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEncryptFile(e.target.files[0] ?? null);
      setEncryptError(null);
      setEncryptSuccess(false);
      setEncryptedUrl(null);
    }
  };

  // Handle decrypt file change
  const handleDecryptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDecryptFile(e.target.files[0] ?? null);
      setDecryptError(null);
      setDecryptSuccess(false);
      setDecryptedUrl(null);
    }
  };

  // Function to encrypt file
  const encryptFileWithPassword = async () => {
    if (!encryptFile) {
      setEncryptError('Please select a file to encrypt');
      return;
    }

    if (!encryptPassword || encryptPassword.length < 6) {
      setEncryptError('Please enter a password (minimum 6 characters)');
      return;
    }

    setEncryptLoading(true);
    setEncryptError(null);
    setEncryptSuccess(false);
    setEncryptedUrl(null);

    try {
      // Read the file as array buffer
      const fileBuffer = await encryptFile.arrayBuffer();

      // Convert the file to Uint8Array
      const fileData = new Uint8Array(fileBuffer);

      // Get the password in a format suitable for encryption
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(encryptPassword);

      // Generate a random salt
      const salt = window.crypto.getRandomValues(new Uint8Array(16));

      // Derive a key from the password using PBKDF2
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey'],
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
      );

      // Generate a random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the file data
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        fileData,
      );

      // Combine salt + iv + encrypted data for storage
      const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      encryptedArray.set(salt, 0);
      encryptedArray.set(iv, salt.length);
      encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // Create a Blob from the encrypted array
      const encryptedBlob = new Blob([encryptedArray], { type: 'application/encrypted' });

      // Create a URL for the encrypted blob
      const encryptedFileUrl = URL.createObjectURL(encryptedBlob);
      setEncryptedUrl(encryptedFileUrl);
      setEncryptSuccess(true);
    } catch (error) {
      setEncryptError('Failed to encrypt file. Please try again.');
      console.error('Encryption error:', error);
    } finally {
      setEncryptLoading(false);
    }
  };

  // Function to decrypt file
  const decryptFileWithPassword = async () => {
    if (!decryptFile) {
      setDecryptError('Please select an encrypted file');
      return;
    }

    if (!decryptPassword) {
      setDecryptError('Please enter the decryption password');
      return;
    }

    setDecryptLoading(true);
    setDecryptError(null);
    setDecryptSuccess(false);
    setDecryptedUrl(null);

    try {
      // Read the file as array buffer
      const fileBuffer = await decryptFile.arrayBuffer();

      // Extract salt (first 16 bytes), iv (next 12 bytes), and encrypted data (rest)
      const encryptedArray = new Uint8Array(fileBuffer);
      const salt = encryptedArray.slice(0, 16);
      const iv = encryptedArray.slice(16, 28);
      const encryptedData = encryptedArray.slice(28);

      // Get the password in a format suitable for decryption
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(decryptPassword);

      // Derive the same key from the password and salt
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey'],
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      );

      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedData,
      );

      // Create a Blob from the decrypted data
      const decryptedBlob = new Blob([decryptedData]);

      // Try to determine the file type
      const filetype = await determineFileType(decryptedData);

      // Create a more specific blob with the determined type
      const typedBlob = new Blob([decryptedData], { type: filetype || 'application/octet-stream' });

      // Create a URL for the decrypted blob
      const decryptedFileUrl = URL.createObjectURL(typedBlob);
      setDecryptedUrl(decryptedFileUrl);
      setDecryptSuccess(true);

      // Try to get the original file name from the encrypted file
      setDecryptedFileName(getOriginalFileName(decryptFile.name) || 'decrypted-file');
    } catch (error) {
      setDecryptError('Failed to decrypt file. Incorrect password or corrupted file.');
      console.error('Decryption error:', error);
    } finally {
      setDecryptLoading(false);
    }
  };

  // Helper function to get the original file name
  const getOriginalFileName = (encryptedName: string) => {
    // Remove the .encrypted extension if present
    if (encryptedName.endsWith('.encrypted')) {
      return encryptedName.substring(0, encryptedName.length - 10);
    }
    return encryptedName;
  };

  // Helper function to determine file type from content
  const determineFileType = async (buffer: ArrayBuffer): Promise<string | null> => {
    const arr = new Uint8Array(buffer.slice(0, 4));

    // Check for common file signatures
    // PDF: %PDF (25 50 44 46)
    if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
      return 'application/pdf';
    }

    // JPEG: FF D8 FF
    if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47
    if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47) {
      return 'image/png';
    }

    // GIF: GIF8 (47 49 46 38)
    if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
      return 'image/gif';
    }

    // ZIP: PK (50 4B)
    if (arr[0] === 0x50 && arr[1] === 0x4b) {
      return 'application/zip';
    }

    // Try to detect text files
    try {
      const text = new TextDecoder().decode(buffer.slice(0, 50));

      if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
        return 'text/html';
      }

      if (text.includes('{') && text.includes(':')) {
        return 'application/json';
      }

      if (text.match(/^[\w\s\-_.,;:'"!@#$%^&*()+=/\\|<>?`~\[\]{}]*$/)) {
        return 'text/plain';
      }
    } catch (e) {
      // Not a text file
    }

    // Default unknown type
    return null;
  };

  return (
    <div className="relative mx-auto my-6 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-xl dark:border-slate-700 dark:from-slate-900/60 dark:via-slate-950/80 dark:to-slate-900/60">
      <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-slate-200 opacity-30 blur-2xl dark:bg-slate-800" />
      <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 rounded-full bg-slate-100 opacity-20 blur-2xl dark:bg-slate-900" />

      <h2 className="z-10 mb-3 text-2xl font-extrabold tracking-tight text-slate-800 drop-shadow-lg dark:text-slate-100">
        <span className="mr-2 inline-block align-middle">
          <Lock className="h-6 w-6 text-slate-500 dark:text-slate-300" />
        </span>
        File Encryption & Decryption
      </h2>

      <p className="z-10 mb-6 max-w-lg text-center text-sm text-slate-700/80 dark:text-slate-200/80 md:text-base">
        Securely encrypt and decrypt your files with password protection using AES-256 encryption.
        Your files never leave your browser.
      </p>

      <div className="z-10 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="encrypt" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Encrypt Files</span>
            </TabsTrigger>
            <TabsTrigger value="decrypt" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              <span>Decrypt Files</span>
            </TabsTrigger>
          </TabsList>

          {/* Encrypt Tab */}
          <TabsContent value="encrypt" className="space-y-4">
            <div className="flex flex-col gap-4">
              {/* File Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select File to Encrypt
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => encryptInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Select File</span>
                  </Button>
                  <input
                    type="file"
                    ref={encryptInputRef}
                    onChange={handleEncryptFileChange}
                    className="hidden"
                  />
                  {encryptFile && (
                    <span className="overflow-hidden text-ellipsis text-sm text-slate-700 dark:text-slate-300">
                      {encryptFile.name} ({(encryptFile.size / 1024).toFixed(2)} KB)
                    </span>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Key className="h-4 w-4" />
                  <span>Encryption Password</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Choose a strong password. You&apos;ll need this exact password to decrypt
                          the file later.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="password"
                  placeholder="Enter a strong password"
                  value={encryptPassword}
                  onChange={(e) => setEncryptPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Encrypt Button */}
              <Button
                onClick={encryptFileWithPassword}
                disabled={encryptLoading || !encryptFile || !encryptPassword}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white hover:from-slate-800 hover:to-slate-950"
              >
                {encryptLoading ? 'Encrypting...' : 'Encrypt File'}
              </Button>

              {/* Error Message */}
              {encryptError && (
                <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span>{encryptError}</span>
                </div>
              )}

              {/* Success Message */}
              {encryptSuccess && encryptedUrl && (
                <div className="rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
                  <h3 className="mb-2 flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                    <span className="rounded-full bg-green-200 p-1 dark:bg-green-800">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    File Encrypted Successfully!
                  </h3>
                  <p className="mb-3 text-sm text-green-700 dark:text-green-300">
                    Your file has been encrypted. Download it and keep it safe.
                  </p>
                  <a
                    href={encryptedUrl}
                    download={`${encryptFile?.name || 'file'}.encrypted`}
                    className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                    Download Encrypted File
                  </a>
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Important: Keep your password in a safe place. If you lose it, the file cannot
                    be decrypted.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Decrypt Tab */}
          <TabsContent value="decrypt" className="space-y-4">
            <div className="flex flex-col gap-4">
              {/* File Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Encrypted File
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => decryptInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Select File</span>
                  </Button>
                  <input
                    type="file"
                    ref={decryptInputRef}
                    onChange={handleDecryptFileChange}
                    className="hidden"
                  />
                  {decryptFile && (
                    <span className="overflow-hidden text-ellipsis text-sm text-slate-700 dark:text-slate-300">
                      {decryptFile.name} ({(decryptFile.size / 1024).toFixed(2)} KB)
                    </span>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Key className="h-4 w-4" />
                  <span>Decryption Password</span>
                </label>
                <Input
                  type="password"
                  placeholder="Enter the password used for encryption"
                  value={decryptPassword}
                  onChange={(e) => setDecryptPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Decrypt Button */}
              <Button
                onClick={decryptFileWithPassword}
                disabled={decryptLoading || !decryptFile || !decryptPassword}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white hover:from-slate-800 hover:to-slate-950"
              >
                {decryptLoading ? 'Decrypting...' : 'Decrypt File'}
              </Button>

              {/* Error Message */}
              {decryptError && (
                <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span>{decryptError}</span>
                </div>
              )}

              {/* Success Message */}
              {decryptSuccess && decryptedUrl && (
                <div className="rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
                  <h3 className="mb-2 flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                    <span className="rounded-full bg-green-200 p-1 dark:bg-green-800">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    File Decrypted Successfully!
                  </h3>
                  <p className="mb-3 text-sm text-green-700 dark:text-green-300">
                    Your file has been decrypted and is ready to download.
                  </p>
                  <a
                    href={decryptedUrl}
                    download={decryptedFileName}
                    className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                    Download Decrypted File
                  </a>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-slate-500 dark:text-slate-400"
            >
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Security Information:
          </h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>All encryption/decryption happens locally in your browser</li>
            <li>Files are never uploaded to any server</li>
            <li>Uses AES-256-GCM encryption with PBKDF2 key derivation</li>
            <li>Password and file contents are never stored or transmitted</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileEncryptor;
