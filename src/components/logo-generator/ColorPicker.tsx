'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  // Primary colors
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Light Blue
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  
  // Neutrals
  '#000000', // Black
  '#171717', // Neutral-900
  '#404040', // Neutral-700
  '#737373', // Neutral-500
  '#a3a3a3', // Neutral-400
  '#d4d4d4', // Neutral-300
  '#e5e5e5', // Neutral-200
  '#f5f5f5', // Neutral-100
  '#ffffff', // White
];

const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const [selectedColor, setSelectedColor] = useState(color);
  const [customColor, setCustomColor] = useState(color);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setSelectedColor(color);
    setCustomColor(color);
  }, [color]);

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    onChange(newColor);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
  };

  const handleCustomColorSubmit = () => {
    // Validate hex color
    const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColor);
    if (isValidHex) {
      handleColorChange(customColor);
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between",
            selectedColor === "#ffffff" && "border-gray-300"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
            <span>{selectedColor}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              className={cn(
                "h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center",
                selectedColor === presetColor && "ring-2 ring-offset-2 ring-black dark:ring-white"
              )}
              style={{ backgroundColor: presetColor }}
              onClick={() => handleColorChange(presetColor)}
            >
              {selectedColor === presetColor && (
                <Check className={cn(
                  "h-4 w-4",
                  presetColor === "#ffffff" || presetColor === "#f5f5f5" || presetColor === "#e5e5e5" 
                    ? "text-black" 
                    : "text-white"
                )} />
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <div className="flex-grow flex border rounded-md overflow-hidden">
            <input
              ref={inputRef}
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              onClick={handleInputClick}
              onBlur={handleCustomColorSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomColorSubmit()}
              className="flex-grow px-3 py-1 text-sm border-none focus:outline-none bg-background"
              placeholder="#RRGGBB"
            />
            <div
              className="w-10 h-full"
              style={{ backgroundColor: customColor }}
            />
          </div>
          <Button 
            size="sm" 
            onClick={handleCustomColorSubmit}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
