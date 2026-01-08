'use client'

import { ChevronDown } from 'lucide-react'

interface FilterDropdownProps {
 label: string
 value: string
 onChange: (value: string) => void
 options: { value: string; label: string }[]
 placeholder?: string
 className?: string
}

export default function FilterDropdown({
 label,
 value,
 onChange,
 options,
 placeholder = "Select...",
 className = ""
}: FilterDropdownProps) {
 return (
 <div className={`space-y-2 ${className}`}>
 <label className="text-sm font-medium text-foreground">{label}</label>
 <div className="relative">
 <select
 value={value}
 onChange={(e) => onChange(e.target.value)}
 className="w-full h-11 pl-3 pr-10 bg-background border border-input rounded-md text-sm focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none appearance-none"
 >
 <option value="">All {label}</option>
 {options.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
 </div>
 </div>
 )
}