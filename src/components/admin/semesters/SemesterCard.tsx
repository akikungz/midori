"use client";

import { CalendarDays, Plus, Edit, Check, Trash2, Star } from "lucide-react";

import type { Semester } from "@midori/types/admin";
import { formatDate } from "@midori/lib/format";
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

interface SemesterCardProps {
  semester: Semester;
  onEdit: (semester: Semester) => void;
  onDelete: (semester: Semester) => void;
  onSetAsCurrent: (semester: Semester) => void;
}

/**
 * Individual semester card component
 */
export function SemesterCard({
  semester,
  onEdit,
  onDelete,
  onSetAsCurrent,
}: SemesterCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{semester.name}</CardTitle>
            <CardDescription>
              {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
            </CardDescription>
          </div>
          {semester.isCurrent && (
            <Badge variant="default">
              <Check className="mr-1 size-3" />
              Current
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(semester)}>
            <Edit className="mr-1.5 size-3.5" />
            Edit
          </Button>
          {!semester.isCurrent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetAsCurrent(semester)}
            >
              <Star className="mr-1.5 size-3.5" />
              Set Current
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(semester)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SemestersGridProps {
  semesters: Semester[];
  searchQuery: string;
  onEdit: (semester: Semester) => void;
  onDelete: (semester: Semester) => void;
  onSetAsCurrent: (semester: Semester) => void;
  onAdd: () => void;
}

/**
 * Grid layout for displaying semester cards
 */
export function SemestersGrid({
  semesters,
  searchQuery,
  onEdit,
  onDelete,
  onSetAsCurrent,
  onAdd,
}: SemestersGridProps) {
  if (semesters.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <CalendarDays />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No Semesters</EmptyTitle>
          <EmptyDescription>
            {searchQuery
              ? "No semesters match your search."
              : "No semesters have been added yet."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            Add Semester
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {semesters.map((semester) => (
        <SemesterCard
          key={semester.id}
          semester={semester}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetAsCurrent={onSetAsCurrent}
        />
      ))}
    </div>
  );
}
