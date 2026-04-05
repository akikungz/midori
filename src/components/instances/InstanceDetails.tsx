import { Terminal, Activity } from "lucide-react";

import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Separator } from "@midori/components/ui/separator";

import type { VmDetails, CourseOffering } from "./InstanceCard";

// ==================== VM Details Card ====================

interface VmDetailsCardProps {
  vmDetails: VmDetails;
  showCredentials?: boolean;
  defaultUser?: string;
  defaultPassword?: string;
}

export function VmDetailsCard({
  vmDetails,
  showCredentials = false,
  defaultUser,
  defaultPassword,
}: VmDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Virtual Machine Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Hostname" value={vmDetails.hostname} />
          <DetailItem label="IP Address" value={vmDetails.ip} mono />
          <DetailItem label="Operating System" value={vmDetails.os} />
          <DetailItem label="CPU Cores" value={`${vmDetails.cpus} vCPU`} />
          <DetailItem
            label="Memory"
            value={`${(vmDetails.memoryMB / 1024).toFixed(1)} GB`}
          />
          <DetailItem label="Disk Size" value={`${vmDetails.diskGB} GB`} />
        </div>

        {showCredentials && (defaultUser || defaultPassword) && (
          <>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Default User"
                value={defaultUser || "-"}
                mono
              />
              <DetailItem
                label="Default Password"
                value={defaultPassword || "-"}
                mono
              />
            </div>
          </>
        )}

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
  );
}

// ==================== Course Information Card ====================

interface CourseInfoCardProps {
  courseOffering: CourseOffering;
  workSemester?: string;
}

export function CourseInfoCard({ courseOffering, workSemester }: CourseInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Course Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4">
          <DetailItem label="Course Code" value={courseOffering.courseCode} mono />
          <DetailItem label="Course Title" value={courseOffering.courseTitle} className="sm:col-span-2" />
          <DetailItem
            label="Instance Semester"
            value={workSemester ? `${courseOffering.semester} - ${workSemester}` : courseOffering.semester}
            mono
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Detail Item Component ====================

interface DetailItemProps {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}

function DetailItem({ label, value, mono, className }: DetailItemProps) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
