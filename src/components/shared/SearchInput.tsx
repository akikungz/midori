"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@midori/components/ui/input";
import { Button } from "@midori/components/ui/button";
import { cn } from "@midori/lib/utils";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  containerClassName?: string;
}

/**
 * A reusable search input component with search icon and optional clear button
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      showClear = true,
      placeholder = "Search...",
      containerClassName,
      className,
      ...props
    },
    ref,
  ) => {
    const handleClear = () => {
      onChange("");
      onClear?.();
    };

    return (
      <div className={cn("relative", containerClassName)}>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          placeholder={placeholder}
          className={cn("pl-9", showClear && value && "pr-9", className)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
        {showClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
            onClick={handleClear}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
