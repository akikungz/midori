"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  FilePlus,
  Pencil,
  CheckSquare,
  Square,
} from "lucide-react";

import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";

// ==================== Status Config ====================

export const statusConfig = {
  PENDING: {
    variant: "secondary" as const,
    icon: Clock,
    label: "Pending",
  },
  APPROVED: {
    variant: "default" as const,
    icon: CheckCircle,
    label: "Approved",
  },
  REJECTED: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
  },
  CANCELLED: {
    variant: "outline" as const,
    icon: Ban,
    label: "Cancelled",
  },
};

export type RequestStatus = keyof typeof statusConfig;

// ==================== Instance Request Types ====================

export interface InstanceRequestSpecs {
  cpus: number;
  memoryMB: number;
  diskGB: number;
}

export interface CourseOffering {
  courseCode: string;
  courseTitle?: string;
  semester: string;
}

export interface InstanceRequest {
  id: number;
  title: string;
  description?: string;
  status: RequestStatus;
  specs: InstanceRequestSpecs;
  templateName?: string;
  courseOffering?: CourseOffering;
}

export interface ExtendedRequest {
  id: number;
  title: string;
  description?: string;
  reason?: string;
  status: RequestStatus;
  targetInstanceId: number;
  courseOffering?: CourseOffering;
}

// ==================== Instance Request Card ====================

interface InstanceRequestCardProps {
  request: InstanceRequest;
  canReview: boolean;
  isActionLoading: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: (specs?: InstanceRequestSpecs) => void;
  onReject: () => void;
}

export function InstanceRequestCard({
  request,
  canReview,
  isActionLoading,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
}: InstanceRequestCardProps) {
  const StatusIcon = statusConfig[request.status].icon;
  const isPendingReview = canReview && request.status === "PENDING";

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [draftSpecs, setDraftSpecs] = useState<InstanceRequestSpecs>(
    request.specs,
  );

  useEffect(() => {
    setDraftSpecs(request.specs);
    setIsEditingSpecs(false);
  }, [request.specs]);

  const handleSpecChange = (
    field: keyof InstanceRequestSpecs,
    value: number,
  ) => {
    setDraftSpecs((previous) => ({
      ...previous,
      [field]: Number.isFinite(value) ? Math.max(1, value) : previous[field],
    }));
  };

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{request.title}</CardTitle>
              <Badge variant={statusConfig[request.status].variant}>
                <StatusIcon className="mr-1 size-3" />
                {statusConfig[request.status].label}
              </Badge>
            </div>
            <CardDescription>
              {request.courseOffering
                ? `${request.courseOffering.courseCode} - ${request.courseOffering.semester}`
                : "No course assigned"}
            </CardDescription>
          </div>
          {isPendingReview && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleSelect}
                disabled={isActionLoading}
              >
                {isSelected ? (
                  <CheckSquare className="mr-1.5 size-3.5" />
                ) : (
                  <Square className="mr-1.5 size-3.5" />
                )}
                {isSelected ? "Selected" : "Select"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={() => setIsEditingSpecs((value) => !value)}
              >
                <Pencil className="mr-1.5 size-3.5" />
                {isEditingSpecs ? "Close edit" : "Edit specs"}
              </Button>

              <Button
                variant="default"
                size="sm"
                disabled={isActionLoading}
                onClick={() => onApprove(draftSpecs)}
              >
                <CheckCircle className="mr-1.5 size-3.5" />
                {isActionLoading ? "..." : "Approve"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                disabled={isActionLoading}
                onClick={onReject}
              >
                <XCircle className="mr-1.5 size-3.5" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditingSpecs && isPendingReview ? (
          <EditableRequestSpecs
            specs={draftSpecs}
            onChange={handleSpecChange}
          />
        ) : null}
        <RequestSpecs
          cpus={draftSpecs.cpus}
          memoryMB={draftSpecs.memoryMB}
          diskGB={draftSpecs.diskGB}
          templateName={request.templateName}
        />
        {request.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Extended Request Card ====================

interface ExtendedRequestCardProps {
  request: ExtendedRequest;
  canReview: boolean;
  isActionLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function ExtendedRequestCard({
  request,
  canReview,
  isActionLoading,
  onApprove,
  onReject,
}: ExtendedRequestCardProps) {
  const StatusIcon = statusConfig[request.status].icon;

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{request.title}</CardTitle>
              <Badge variant={statusConfig[request.status].variant}>
                <StatusIcon className="mr-1 size-3" />
                {statusConfig[request.status].label}
              </Badge>
            </div>
            <CardDescription>
              Instance: #{request.targetInstanceId}
            </CardDescription>
          </div>
          {canReview && request.status === "PENDING" && (
            <RequestActionButtons
              isLoading={isActionLoading}
              onApprove={onApprove}
              onReject={onReject}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {request.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        )}
        {request.reason && (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Reason:</span>{" "}
            {request.reason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Request Specs Component ====================

interface RequestSpecsProps {
  cpus: number;
  memoryMB: number;
  diskGB: number;
  templateName?: string;
}

function RequestSpecs({
  cpus,
  memoryMB,
  diskGB,
  templateName,
}: RequestSpecsProps) {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <div>
        <span className="font-medium text-foreground">{cpus}</span> vCPU
      </div>
      <div>
        <span className="font-medium text-foreground">{memoryMB / 1024}</span>{" "}
        GB RAM
      </div>
      <div>
        <span className="font-medium text-foreground">{diskGB}</span> GB Disk
      </div>
      {templateName && (
        <div>
          Template:{" "}
          <span className="font-medium text-foreground">{templateName}</span>
        </div>
      )}
    </div>
  );
}

interface EditableRequestSpecsProps {
  specs: InstanceRequestSpecs;
  onChange: (field: keyof InstanceRequestSpecs, value: number) => void;
}

function EditableRequestSpecs({ specs, onChange }: EditableRequestSpecsProps) {
  return (
    <div className="mb-3 grid gap-3 rounded-md border p-3 sm:grid-cols-3">
      <label htmlFor="review-spec-cpus" className="space-y-1 text-sm">
        <span className="text-muted-foreground">vCPU</span>
        <Input
          id="review-spec-cpus"
          type="number"
          min={1}
          value={specs.cpus}
          onChange={(event) => onChange("cpus", Number(event.target.value))}
        />
      </label>

      <label htmlFor="review-spec-memory" className="space-y-1 text-sm">
        <span className="text-muted-foreground">Memory (MB)</span>
        <Input
          id="review-spec-memory"
          type="number"
          min={1024}
          step={512}
          value={specs.memoryMB}
          onChange={(event) => onChange("memoryMB", Number(event.target.value))}
        />
      </label>

      <label htmlFor="review-spec-disk" className="space-y-1 text-sm">
        <span className="text-muted-foreground">Disk (GB)</span>
        <Input
          id="review-spec-disk"
          type="number"
          min={16}
          step={1}
          value={specs.diskGB}
          onChange={(event) => onChange("diskGB", Number(event.target.value))}
        />
      </label>
    </div>
  );
}

// ==================== Request Action Buttons ====================

interface RequestActionButtonsProps {
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function RequestActionButtons({
  isLoading,
  onApprove,
  onReject,
}: RequestActionButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        disabled={isLoading}
        onClick={onApprove}
      >
        <CheckCircle className="mr-1.5 size-3.5" />
        {isLoading ? "..." : "Approve"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={isLoading}
        onClick={onReject}
      >
        <XCircle className="mr-1.5 size-3.5" />
        Reject
      </Button>
    </div>
  );
}

// ==================== Request Lists ====================

interface InstanceRequestsListProps {
  requests: InstanceRequest[];
  canReview: boolean;
  actionLoadingIds: Set<number>;
  selectedRequestIds: Set<number>;
  onToggleSelect: (requestId: number) => void;
  onAction: (
    requestId: number,
    action: "APPROVED" | "REJECTED",
    specs?: InstanceRequestSpecs,
  ) => void;
}

export function InstanceRequestsList({
  requests,
  canReview,
  actionLoadingIds,
  selectedRequestIds,
  onToggleSelect,
  onAction,
}: InstanceRequestsListProps) {
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <InstanceRequestCard
          key={request.id}
          request={request}
          canReview={canReview}
          isActionLoading={actionLoadingIds.has(request.id)}
          isSelected={selectedRequestIds.has(request.id)}
          onToggleSelect={() => onToggleSelect(request.id)}
          onApprove={(specs) => onAction(request.id, "APPROVED", specs)}
          onReject={() => onAction(request.id, "REJECTED")}
        />
      ))}
    </div>
  );
}

interface ExtendedRequestsListProps {
  requests: ExtendedRequest[];
  canReview: boolean;
  actionLoadingIds: Set<number>;
  selectedRequestIds: Set<number>;
  onToggleSelect: (requestId: number) => void;
  onAction: (requestId: number, action: "APPROVED" | "REJECTED") => void;
}

export function ExtendedRequestsList({
  requests,
  canReview,
  actionLoadingIds,
  selectedRequestIds,
  onToggleSelect,
  onAction,
}: ExtendedRequestsListProps) {
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="space-y-2">
          {canReview && request.status === "PENDING" ? (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleSelect(request.id)}
                disabled={actionLoadingIds.has(request.id)}
              >
                {selectedRequestIds.has(request.id) ? (
                  <CheckSquare className="mr-1.5 size-3.5" />
                ) : (
                  <Square className="mr-1.5 size-3.5" />
                )}
                {selectedRequestIds.has(request.id) ? "Selected" : "Select"}
              </Button>
            </div>
          ) : null}

          <ExtendedRequestCard
            request={request}
            canReview={canReview}
            isActionLoading={actionLoadingIds.has(request.id)}
            onApprove={() => onAction(request.id, "APPROVED")}
            onReject={() => onAction(request.id, "REJECTED")}
          />
        </div>
      ))}
    </div>
  );
}

// ==================== Empty States ====================

interface EmptyInstanceRequestsProps {
  isStudent: boolean;
  canCreateRequest: boolean;
}

export function EmptyInstanceRequests({
  isStudent,
  canCreateRequest,
}: EmptyInstanceRequestsProps) {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <FileText />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No Instance Requests</EmptyTitle>
        <EmptyDescription>
          {isStudent
            ? "You haven't made any requests yet."
            : "No requests to review."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {canCreateRequest && (
          <Button asChild>
            <Link href="/dashboard/requests/new">
              <Plus className="mr-2 size-4" />
              Create Request
            </Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

interface EmptyExtendedRequestsProps {
  isStudent: boolean;
}

export function EmptyExtendedRequests({
  isStudent,
}: EmptyExtendedRequestsProps) {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <FilePlus />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No Extension Requests</EmptyTitle>
        <EmptyDescription>
          {isStudent
            ? "You haven't made any extension requests yet."
            : "No extension requests to review."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
