import { useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Globe,
  ExternalLink,
  History,
  LoaderCircle,
} from "lucide-react";

import { fetchClient } from "@midori/lib/api";
import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import type { Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midori/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@midori/components/ui/field";
import { Input } from "@midori/components/ui/input";
import { Textarea } from "@midori/components/ui/textarea";
import { Autocomplete } from "@midori/components/ui/autocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midori/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import type { components } from "@midori/types/api";

type NextSemester = components["schemas"]["GetNextSemesterResponse"] | null;
const INSTRUCTOR_INSTANCE_MAX_MEMORY_GB = 8;
const INSTRUCTOR_INSTANCE_MAX_DISK_GB = 32;
const INSTRUCTOR_INSTANCE_MAX_VCPU = 8;

// ==================== Create Instance Dialog ====================

interface CreateInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: Role;
  onSubmit: (data: {
    pveTemplateId: number;
    cpus: number;
    memoryGB: number;
    diskGB: number;
    courseOfferingId?: number;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateInstanceDialog({
  open,
  onOpenChange,
  userRole,
  onSubmit,
  isSubmitting,
}: CreateInstanceDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [selectedCourseOfferingId, setSelectedCourseOfferingId] = useState<
    number | null
  >(null);
  const [cpus, setCpus] = useState("2");
  const [memoryGB, setMemoryGB] = useState("8");
  const [diskGB, setDiskGB] = useState("32");
  const maxVcpu =
    userRole === "ADMIN" || userRole === "INSTRUCTOR"
      ? INSTRUCTOR_INSTANCE_MAX_VCPU
      : 16;
  const maxMemoryGB =
    userRole === "ADMIN" || userRole === "INSTRUCTOR"
      ? INSTRUCTOR_INSTANCE_MAX_MEMORY_GB
      : 64;
  const maxDiskGB =
    userRole === "ADMIN" || userRole === "INSTRUCTOR"
      ? INSTRUCTOR_INSTANCE_MAX_DISK_GB
      : 500;
  const minDiskGB = 8;

  // Use autocomplete hook for course offerings
  const courseOfferingsAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/course-offerings",
    limit: 20,
    enabled: open,
  });

  // Use autocomplete hook for templates
  const templatesAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/templates",
    limit: 20,
    enabled: open, // Only fetch when dialog is open
  });
  const resetTemplateAutocomplete = templatesAutocomplete.reset;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedTemplateId(null);
      setSelectedCourseOfferingId(null);
      setCpus("2");
      setMemoryGB(String(maxMemoryGB));
      setDiskGB(String(maxDiskGB));
      resetTemplateAutocomplete();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!selectedTemplateId) return;
    await onSubmit({
      pveTemplateId: selectedTemplateId,
      cpus: Math.min(Number(cpus), maxVcpu),
      memoryGB: Math.min(Number(memoryGB), maxMemoryGB),
      diskGB: Math.min(Math.max(Number(diskGB), minDiskGB), maxDiskGB),
      courseOfferingId: selectedCourseOfferingId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Instance</DialogTitle>
          <DialogDescription>
            Configure and create a new virtual machine instance
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="course">Course (optional)</FieldLabel>
            <FieldDescription>
              Link this instance to a course offering
            </FieldDescription>
            <Autocomplete
              placeholder="Select a course..."
              searchPlaceholder="Search courses..."
              search={courseOfferingsAutocomplete.search}
              onSearchChange={courseOfferingsAutocomplete.setSearch}
              options={courseOfferingsAutocomplete.options}
              isLoading={courseOfferingsAutocomplete.isLoading}
              value={selectedCourseOfferingId}
              onChange={setSelectedCourseOfferingId}
              emptyMessage="No courses found."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="pve-template">Template</FieldLabel>
            <FieldDescription>
              Select a PVE template for the instance
            </FieldDescription>
            <Autocomplete
              placeholder="Select a template..."
              searchPlaceholder="Search templates..."
              search={templatesAutocomplete.search}
              onSearchChange={templatesAutocomplete.setSearch}
              options={templatesAutocomplete.options}
              isLoading={templatesAutocomplete.isLoading}
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              emptyMessage="No templates found."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cpus">CPU Cores</FieldLabel>
            <FieldDescription>Number of virtual CPU cores</FieldDescription>
            <Input
              id="cpus"
              type="number"
              min="1"
              max={String(maxVcpu)}
              value={cpus}
              onChange={(e) =>
                setCpus(String(Math.min(Number(e.target.value), maxVcpu)))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="memory">Memory (GB)</FieldLabel>
            <FieldDescription>Amount of RAM in gigabytes</FieldDescription>
            <Input
              id="memory"
              type="number"
              min="1"
              max={String(maxMemoryGB)}
              value={memoryGB}
              onChange={(e) =>
                setMemoryGB(
                  String(Math.min(Number(e.target.value), maxMemoryGB)),
                )
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="disk">Disk Size (GB)</FieldLabel>
            <FieldDescription>Storage capacity in gigabytes</FieldDescription>
            <Input
              id="disk"
              type="number"
              min={String(minDiskGB)}
              max={String(maxDiskGB)}
              value={diskGB}
              onChange={(e) =>
                setDiskGB(
                  String(
                    Math.min(
                      Math.max(Number(e.target.value), minDiskGB),
                      maxDiskGB,
                    ),
                  ),
                )
              }
            />
          </Field>
          <Button
            className="w-full lg:col-span-2"
            disabled={!selectedTemplateId || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Creating..." : "Create Instance"}
          </Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Extension Request Dialog ====================

interface ExtensionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting: boolean;
  disabled?: boolean;
  triggerLabel?: string;
}

export function ExtensionRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  disabled = false,
  triggerLabel = "Request Extension",
}: ExtensionRequestDialogProps) {
  const [extensionReason, setExtensionReason] = useState("");
  const [nextSemester, setNextSemester] = useState<NextSemester>(null);
  const [isLoadingNextSemester, setIsLoadingNextSemester] = useState(false);
  const [nextSemesterError, setNextSemesterError] = useState<string | null>(
    null,
  );

  const handleOpenChange = async (nextOpen: boolean) => {
    if (!nextOpen) {
      setExtensionReason("");
      setNextSemester(null);
      setNextSemesterError(null);
      setIsLoadingNextSemester(false);
      onOpenChange(nextOpen);
      return;
    }

    onOpenChange(nextOpen);
    setIsLoadingNextSemester(true);
    setNextSemesterError(null);

    const result = await fetchClient
      .GET("/api/academic/semesters/next")
      .catch(() => null);

    setIsLoadingNextSemester(false);

    if (!result || result.error) {
      setNextSemester(null);
      setNextSemesterError("Unable to check the next semester right now.");
      return;
    }

    setNextSemester((result.data ?? null) as NextSemester);
  };

  const handleSubmit = async () => {
    if (!extensionReason || !nextSemester || isLoadingNextSemester) return;
    await onSubmit(extensionReason);
  };

  const submitDisabled =
    !extensionReason ||
    isSubmitting ||
    isLoadingNextSemester ||
    !nextSemester ||
    !!nextSemesterError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Clock className="mr-2 size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Instance Extension</DialogTitle>
          <DialogDescription>
            Request to extend this instance to the next semester
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Field className="lg:col-span-2">
            <FieldLabel>Next Semester</FieldLabel>
            <FieldDescription>
              Extension requests are only available when an upcoming semester
              exists.
            </FieldDescription>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {isLoadingNextSemester ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Checking next semester availability...
                </div>
              ) : nextSemester ? (
                <div>
                  <p className="font-medium">{nextSemester.name}</p>
                  <p className="text-muted-foreground">
                    This instance will be requested for the upcoming semester.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {nextSemesterError ||
                    "No upcoming semester is available for extension requests yet."}
                </p>
              )}
            </div>
          </Field>
          <Field className="lg:col-span-2">
            <FieldLabel htmlFor="extension-reason">Reason</FieldLabel>
            <FieldDescription>
              Explain why you need this extension
            </FieldDescription>
            <Textarea
              id="extension-reason"
              placeholder="I need more time to complete my project because..."
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
              rows={4}
            />
          </Field>
          <Button
            className="w-full lg:col-span-2"
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Extension Request"}
          </Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Add Proxy Dialog ====================

interface AddProxyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    port: number;
    type: "HTTP" | "TCP";
    description?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function AddProxyDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AddProxyDialogProps) {
  const [proxyPort, setProxyPort] = useState("");
  const [proxyType, setProxyType] = useState<"HTTP" | "TCP">("HTTP");
  const [proxyDescription, setProxyDescription] = useState("");

  const handleSubmit = async () => {
    if (!proxyPort) return;
    await onSubmit({
      port: Number(proxyPort),
      type: proxyType,
      description: proxyDescription || undefined,
    });
    setProxyPort("");
    setProxyType("HTTP");
    setProxyDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Add Proxy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Reverse Proxy</DialogTitle>
          <DialogDescription>
            Configure a new reverse proxy for this instance. Use HTTP for web
            apps and TCP for raw services such as SSH, databases, or custom
            sockets.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="proxy-port">Target Port</FieldLabel>
            <FieldDescription>
              Enter the port listening inside the VM. If you wrap a plain TCP
              service with a local TLS tunnel, use the tunnel port here instead
              of the original service port.
            </FieldDescription>
            <Input
              id="proxy-port"
              type="number"
              placeholder="3000"
              value={proxyPort}
              onChange={(e) => setProxyPort(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="proxy-type">Type</FieldLabel>
            <FieldDescription>
              Plain TCP services do not speak HTTP and may also need a local TLS
              wrapper. In that case, choose TCP and forward to a tunnel created
              with tools like `ncat --ssl` or `stunnel`.
            </FieldDescription>
            <Select
              value={proxyType}
              onValueChange={(v) => setProxyType(v as "HTTP" | "TCP")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HTTP">HTTP</SelectItem>
                <SelectItem value="TCP">TCP</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field className="lg:col-span-2">
            <FieldLabel htmlFor="proxy-desc">Description (Optional)</FieldLabel>
            <Input
              id="proxy-desc"
              placeholder="Web server, API, etc."
              value={proxyDescription}
              onChange={(e) => setProxyDescription(e.target.value)}
            />
          </Field>
          <Button
            className="w-full lg:col-span-2"
            disabled={!proxyPort || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Adding..." : "Add Proxy"}
          </Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Delete Instance Dialog ====================

interface DeleteInstanceDialogProps {
  onConfirm: () => Promise<void>;
}

export function DeleteInstanceDialog({ onConfirm }: DeleteInstanceDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Instance</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this instance? This action cannot be
            undone and all data will be permanently lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Delete Instance
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ==================== Reverse Proxy List ====================

export interface ReverseProxy {
  id: number;
  targetPort: number;
  type: "HTTP" | "HTTPS" | "TCP";
  description?: string;
}

interface ReverseProxyListProps {
  proxies: ReverseProxy[];
  onDelete: (proxyId: number) => Promise<void>;
  onAddClick: () => void;
  isAddDialogOpen: boolean;
  onAddDialogChange: (open: boolean) => void;
  onAddProxy: (data: {
    port: number;
    type: "HTTP" | "TCP";
    description?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  hostname: string;
}

export function ReverseProxyList({
  proxies,
  onDelete,
  isAddDialogOpen,
  onAddDialogChange,
  onAddProxy,
  isSubmitting,
  hostname,
}: ReverseProxyListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Reverse Proxies</CardTitle>
          <CardDescription>
            Configure reverse proxies to expose HTTP apps or raw TCP services.
            For TCP services that must sit behind TLS, point the proxy at a
            local tunnel port rather than the original daemon port.
          </CardDescription>
        </div>
        <AddProxyDialog
          open={isAddDialogOpen}
          onOpenChange={onAddDialogChange}
          onSubmit={onAddProxy}
          isSubmitting={isSubmitting}
        />
      </CardHeader>
      <CardContent>
        {proxies && proxies.length > 0 ? (
          <div className="space-y-3">
            {proxies.map((proxy) => (
              <ReverseProxyItem
                key={proxy.id}
                proxy={proxy}
                hostname={hostname}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No reverse proxies configured
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ReverseProxyItemProps {
  hostname: string;
  proxy: ReverseProxy;
  onDelete: (proxyId: number) => Promise<void>;
}

function ReverseProxyItem({
  hostname,
  proxy,
  onDelete,
}: ReverseProxyItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        {proxy.type === "HTTP" ? (
          <ExternalLink className="size-4 mt-0.5 text-muted-foreground" />
        ) : (
          <Globe className="size-4 mt-0.5 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium">Port {proxy.targetPort}</p>
          <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {proxy.type} {proxy.description ? `• ${proxy.description} ` : ""}-{" "}
            {`p${proxy.targetPort}-${hostname}.fitm.cloud`}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {proxy.type === "HTTP" && (
          <a
            href={`https://p${proxy.targetPort}-${hostname}.fitm.cloud`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon">
              <ExternalLink className="size-4" />
            </Button>
          </a>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Proxy</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reverse proxy? Services on
                port {proxy.targetPort} will no longer be accessible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(proxy.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ==================== Audit Log List ====================

export interface AuditLog {
  id: number;
  action: string;
  notes?: string;
  timestamp?: string | number;
}

interface AuditLogListProps {
  logs: AuditLog[];
}

export function AuditLogList({ logs }: AuditLogListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Logs</CardTitle>
        <CardDescription>Activity history for this instance</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No audit logs available
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface AuditLogItemProps {
  log: AuditLog;
}

function AuditLogItem({ log }: AuditLogItemProps) {
  const formattedTime = log.timestamp
    ? new Date(
        typeof log.timestamp === "string" || typeof log.timestamp === "number"
          ? log.timestamp
          : "",
      ).toLocaleString()
    : "";

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <History className="size-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium">{log.action}</p>
        <p className="text-sm text-muted-foreground">
          {log.notes || "No additional notes"}
        </p>
        {formattedTime && (
          <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
        )}
      </div>
    </div>
  );
}
