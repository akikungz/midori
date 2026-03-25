"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";

import { cn } from "@midori/lib/utils";
import { Button } from "@midori/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midori/components/ui/popover";
import { Input } from "@midori/components/ui/input";
import { Badge } from "@midori/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

export interface AutocompleteOption {
  id: number;
  label: string;
}

interface BaseAutocompleteProps {
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Current search query */
  search: string;
  /** Callback when search changes */
  onSearchChange: (value: string) => void;
  /** Available options */
  options: AutocompleteOption[];
  /** Whether options are loading */
  isLoading?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional class name for the trigger button */
  className?: string;
}

interface SingleAutocompleteProps extends BaseAutocompleteProps {
  /** Whether multiple selection is allowed */
  multiple?: false;
  /** Currently selected value */
  value: number | null;
  /** Callback when value changes */
  onChange: (value: number | null) => void;
}

interface MultiAutocompleteProps extends BaseAutocompleteProps {
  /** Whether multiple selection is allowed */
  multiple: true;
  /** Currently selected values */
  value: number[];
  /** Callback when values change */
  onChange: (value: number[]) => void;
}

type AutocompleteProps = SingleAutocompleteProps | MultiAutocompleteProps;

// ============================================================================
// Single Select Autocomplete
// ============================================================================

export function Autocomplete(props: AutocompleteProps) {
  if (props.multiple) {
    return <MultiSelectAutocomplete {...props} />;
  }
  return <SingleSelectAutocomplete {...props} />;
}

function SingleSelectAutocomplete({
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  search,
  onSearchChange,
  options,
  isLoading = false,
  disabled = false,
  emptyMessage = "No options found.",
  className,
  value,
  onChange,
}: SingleAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value],
  );

  // Focus input when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
        </div>
        <div
          id={listboxId}
          role="listbox"
          className="max-h-60 overflow-y-auto p-1"
        >
          {!isLoading && options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => {
                  onChange(option.id === value ? null : option.id);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  option.id === value && "bg-accent text-accent-foreground",
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    option.id === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Multi Select Autocomplete
// ============================================================================

function MultiSelectAutocomplete({
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  search,
  onSearchChange,
  options,
  isLoading = false,
  disabled = false,
  emptyMessage = "No options found.",
  className,
  value,
  onChange,
}: MultiAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  const selectedOptions = React.useMemo(
    () => options.filter((opt) => value.includes(opt.id)),
    [options, value],
  );

  const toggleOption = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const removeOption = (id: number) => {
    onChange(value.filter((v) => v !== id));
  };

  // Focus input when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10",
            selectedOptions.length > 0 && "h-auto",
            className,
          )}
          disabled={disabled}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.id);
                  }}
                >
                  {option.label}
                  <span className="ml-1 cursor-pointer">×</span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
        </div>
        <div
          id={listboxId}
          role="listbox"
          className="max-h-60 overflow-y-auto p-1"
        >
          {!isLoading && options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.id);
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { SingleSelectAutocomplete, MultiSelectAutocomplete };
