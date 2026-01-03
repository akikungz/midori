"use client";

import { Edit, Shield, Users } from "lucide-react";

import { Button } from "@midori/components/ui/button";
import { Card, CardHeader } from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Avatar, AvatarFallback } from "@midori/components/ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import {
  getRoleDisplayName,
  getRoleBadgeVariant,
  type Role,
} from "@midori/lib/roles";

// ============================================================================
// Types
// ============================================================================

export type Instructor = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
};

// ============================================================================
// Utilities
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// Instructor Card
// ============================================================================

interface InstructorCardProps {
  instructor: Instructor;
  onEdit: (instructor: Instructor) => void;
  onPromote: (instructor: Instructor) => void;
}

export function InstructorCard({
  instructor,
  onEdit,
  onPromote,
}: InstructorCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{getInitials(instructor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{instructor.name}</p>
              <p className="text-sm text-muted-foreground">
                {instructor.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getRoleBadgeVariant(instructor.role as Role)}>
              {getRoleDisplayName(instructor.role as Role)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(instructor)}
            >
              <Edit className="mr-1.5 size-3.5" />
              Edit
            </Button>
            {instructor.role !== "ADMIN" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPromote(instructor)}
              >
                <Shield className="mr-1.5 size-3.5" />
                Promote to Admin
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// ============================================================================
// Instructors List
// ============================================================================

interface InstructorsListProps {
  instructors: Instructor[];
  searchQuery: string;
  onEdit: (instructor: Instructor) => void;
  onPromote: (instructor: Instructor) => void;
}

export function InstructorsList({
  instructors,
  searchQuery,
  onEdit,
  onPromote,
}: InstructorsListProps) {
  if (instructors.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No Instructors</EmptyTitle>
          <EmptyDescription>
            {searchQuery
              ? "No instructors found matching your search."
              : "No instructors found in the system."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {instructors.map((instructor) => (
        <InstructorCard
          key={instructor.id}
          instructor={instructor}
          onEdit={onEdit}
          onPromote={onPromote}
        />
      ))}
    </div>
  );
}
