import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  FilePlus,
} from "lucide-react";

import { Button } from "@midori/components/ui/button";
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
}

// ==================== Instance Request Card ====================

interface InstanceRequestCardProps {
  request: InstanceRequest;
  canReview: boolean;
  isActionLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function InstanceRequestCard({
  request,
  canReview,
  isActionLoading,
  onApprove,
  onReject,
}: InstanceRequestCardProps) {
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
              {request.courseOffering
                ? `${request.courseOffering.courseCode} - ${request.courseOffering.semester}`
                : "No course assigned"}
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
        <RequestSpecs
          cpus={request.specs.cpus}
          memoryMB={request.specs.memoryMB}
          diskGB={request.specs.diskGB}
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
  actionLoadingId: number | null;
  onAction: (requestId: number, action: "APPROVED" | "REJECTED") => void;
}

export function InstanceRequestsList({
  requests,
  canReview,
  actionLoadingId,
  onAction,
}: InstanceRequestsListProps) {
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <InstanceRequestCard
          key={request.id}
          request={request}
          canReview={canReview}
          isActionLoading={actionLoadingId === request.id}
          onApprove={() => onAction(request.id, "APPROVED")}
          onReject={() => onAction(request.id, "REJECTED")}
        />
      ))}
    </div>
  );
}

interface ExtendedRequestsListProps {
  requests: ExtendedRequest[];
  canReview: boolean;
  actionLoadingId: number | null;
  onAction: (requestId: number, action: "APPROVED" | "REJECTED") => void;
}

export function ExtendedRequestsList({
  requests,
  canReview,
  actionLoadingId,
  onAction,
}: ExtendedRequestsListProps) {
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <ExtendedRequestCard
          key={request.id}
          request={request}
          canReview={canReview}
          isActionLoading={actionLoadingId === request.id}
          onApprove={() => onAction(request.id, "APPROVED")}
          onReject={() => onAction(request.id, "REJECTED")}
        />
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
