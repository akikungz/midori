import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  FileText,
  FilePlus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@midori/components/ui/tabs";

import { statusConfig, type RequestStatus } from "./RequestCard";

// ==================== Request Type Tabs ====================

interface RequestTypeTabsProps {
  value: "instance" | "extended";
  onValueChange: (value: "instance" | "extended") => void;
}

export function RequestTypeTabs({
  value,
  onValueChange,
}: RequestTypeTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as "instance" | "extended")}
    >
      <TabsList>
        <TabsTrigger value="instance">
          <FileText className="mr-1.5 size-4" />
          Instance Requests
        </TabsTrigger>
        <TabsTrigger value="extended">
          <FilePlus className="mr-1.5 size-4" />
          Extended Requests
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

// ==================== Status Filter Buttons ====================

const statusOptions: Array<RequestStatus | "all"> = [
  "all",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

interface StatusFilterProps {
  value: string;
  onChange: (status: string) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((status) => (
        <Button
          key={status}
          variant={value === status ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(status)}
        >
          {status === "all" ? (
            "All"
          ) : (
            <>
              <StatusFilterIcon status={status} />
              {statusConfig[status].label}
            </>
          )}
        </Button>
      ))}
    </div>
  );
}

function StatusFilterIcon({ status }: { status: RequestStatus }) {
  switch (status) {
    case "PENDING":
      return <Clock className="mr-1.5 size-3.5" />;
    case "APPROVED":
      return <CheckCircle className="mr-1.5 size-3.5" />;
    case "REJECTED":
      return <XCircle className="mr-1.5 size-3.5" />;
    case "CANCELLED":
      return <Ban className="mr-1.5 size-3.5" />;
    default:
      return null;
  }
}

// ==================== Search Input ====================

interface RequestSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function RequestSearch({
  value,
  onChange,
  placeholder = "Search requests...",
  onRefresh,
  isRefreshing,
}: RequestSearchProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-9"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Refresh</span>
        </Button>
      )}
    </div>
  );
}
