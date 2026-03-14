"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface StaffSelectProps {
  value: string;
  onChange: (value: string) => void;
  staffNames: string[];
  defaultNames?: string[]; // highlighted/suggested names (on-duty)
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export default function StaffSelect({
  value,
  onChange,
  staffNames,
  defaultNames = [],
  placeholder = "Select or type a name...",
  required,
  id,
}: StaffSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = staffNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: on-duty names first, then alphabetical
  const sorted = filtered.sort((a, b) => {
    const aOnDuty = defaultNames.some(d => a.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(a.toLowerCase()));
    const bOnDuty = defaultNames.some(d => b.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(b.toLowerCase()));
    if (aOnDuty && !bOnDuty) return -1;
    if (!aOnDuty && bOnDuty) return 1;
    return a.localeCompare(b);
  });

  return (
    <div ref={dropdownRef} className="relative">
      <div className="flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={open ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
            // Also allow free-text entry
            onChange(e.target.value);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2.5 pr-16 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          autoComplete="off"
        />
        <div className="absolute right-2 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSearch("");
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && sorted.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {defaultNames.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-blue-500 uppercase tracking-wider bg-blue-50 border-b border-blue-100">
              On Duty Today
            </div>
          )}
          {sorted.map((name) => {
            const isOnDuty = defaultNames.some(
              d => name.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(name.toLowerCase())
            );
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setSearch("");
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                  name === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                } ${isOnDuty ? "border-l-2 border-blue-400" : ""}`}
              >
                {name}
                {isOnDuty && (
                  <span className="ml-2 text-[10px] text-blue-500 font-medium">scheduled</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
