"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Server,
  Globe,
  Plus,
  Trash2,
  ArrowUpCircle,
  Terminal,
  Activity,
  ExternalLink,
  Clock,
} from "lucide-react";

import { api } from "@midori/lib/api";
import { RoleGuard } from "@midori/components/RoleGuard";
import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@midori/components/ui/tabs";
import { Separator } from "@midori/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midori/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@midori/components/ui/field";
import { Input } from "@midori/components/ui/input";
import { Textarea } from "@midori/components/ui/textarea";

const statusColors = {
  PENDING: "secondary",
  ACTIVE: "default",
  PROMOTED: "destructive",
  INACTIVE: "outline",
  DELETED: "outline",
} as const;

export default function InstanceDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const instanceId = Number(params.id);
  const [extensionDays, setExtensionDays] = useState("7");
  const [extensionReason, setExtensionReason] = useState("");
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);

  const { data: instance, isLoading } = api.useQuery(
    "get",
    "/api/instances/{instanceId}",
    {
      params: {
        path: { instanceId },
      },
    },
  );

  const { data: reverseProxies } = api.useQuery(
    "get",
    "/api/instances/{instanceId}/reverse-proxies",
    {
      params: {
        path: { instanceId },
      },
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Server className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Instance Not Found</h2>
        <p className="text-muted-foreground">
          The requested instance does not exist or you don't have access.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/instances">Back to Instances</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/instances">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {instance.vmDetails?.hostname || `Instance #${instance.id}`}
              </h1>
              <Badge variant={statusColors[instance.status]}>
                {instance.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {instance.courseOffering
                ? `${instance.courseOffering.courseCode} - ${instance.courseOffering.courseTitle}`
                : "No course assigned"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Extension Request for Students */}
          <RoleGuard permission="CREATE_EXTENDED_REQUEST">
            <Dialog open={isExtensionDialogOpen} onOpenChange={setIsExtensionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Clock className="mr-2 size-4" />
                  Request Extension
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Instance Extension</DialogTitle>
                  <DialogDescription>
                    Request to extend this instance to the next semester
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="extension-days">Extension Duration</FieldLabel>
                    <FieldDescription>
                      Number of additional days requested
                    </FieldDescription>
                    <div className="flex items-center gap-2">
                      <Input
                        id="extension-days"
                        type="number"
                        min="1"
                        max="90"
                        value={extensionDays}
                        onChange={(e) => setExtensionDays(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </Field>
                  <Field>
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
                    className="w-full"
                    disabled={!extensionReason}
                    onClick={() => {
                      // TODO: Submit via POST /api/instances/{instanceId}/extended-request
                      setIsExtensionDialogOpen(false);
                      setExtensionDays("7");
                      setExtensionReason("");
                    }}
                  >
                    Submit Extension Request
                  </Button>
                </FieldGroup>
              </DialogContent>
            </Dialog>
          </RoleGuard>
          <RoleGuard permission="PROMOTE_INSTANCE">
            <Button variant="outline">
              <ArrowUpCircle className="mr-2 size-4" />
              Promote
            </Button>
          </RoleGuard>
          <RoleGuard permission="DELETE_INSTANCE">
            <Button variant="destructive">
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </RoleGuard>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proxies">Reverse Proxies</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* VM Details */}
          {instance.vmDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Virtual Machine Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Hostname</p>
                    <p className="font-medium">{instance.vmDetails.hostname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p className="font-mono font-medium">
                      {instance.vmDetails.ip}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Operating System
                    </p>
                    <p className="font-medium">{instance.vmDetails.os}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Cores</p>
                    <p className="font-medium">
                      {instance.vmDetails.cpus} vCPU
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory</p>
                    <p className="font-medium">
                      {(instance.vmDetails.memoryMB / 1024).toFixed(1)} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Disk Size</p>
                    <p className="font-medium">
                      {instance.vmDetails.diskGB} GB
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Terminal className="mr-2 size-4" />
                    SSH Connect
                  </Button>
                  <Button variant="outline" size="sm">
                    <Activity className="mr-2 size-4" />
                    Monitor
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Information */}
          {instance.courseOffering && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Course Code</p>
                    <p className="font-medium">
                      {instance.courseOffering.courseCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Course Title
                    </p>
                    <p className="font-medium">
                      {instance.courseOffering.courseTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Semester</p>
                    <p className="font-medium">
                      {instance.courseOffering.semester}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="proxies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Reverse Proxies</CardTitle>
                <CardDescription>
                  Configure reverse proxies to expose services
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Add Proxy
              </Button>
            </CardHeader>
            <CardContent>
              {reverseProxies && reverseProxies.length > 0 ? (
                <div className="space-y-3">
                  {reverseProxies.map((proxy) => (
                    <div
                      key={proxy.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="size-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Port {proxy.targetPort}</p>
                          <p className="text-sm text-muted-foreground">
                            {proxy.type} •{" "}
                            {proxy.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No reverse proxies configured
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Logs</CardTitle>
              <CardDescription>
                Activity history for this instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Audit logs will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
