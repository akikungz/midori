"use client";

import { GraduationCap, Edit, Power, PowerOff, Plus } from "lucide-react";

import type { Course } from "@midori/types/admin";
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

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onToggleActive: (course: Course) => void;
}

/**
 * Individual course card component
 */
export function CourseCard({
  course,
  onEdit,
  onToggleActive,
}: CourseCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{course.code}</CardTitle>
            <CardDescription className="line-clamp-1">
              {course.title}
            </CardDescription>
          </div>
          <Badge variant={course.isActive ? "default" : "secondary"}>
            {course.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {course.description && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(course)}>
            <Edit className="mr-1.5 size-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(course)}
            className={
              course.isActive
                ? "text-destructive hover:text-destructive"
                : "text-green-600 hover:text-green-600"
            }
          >
            {course.isActive ? (
              <>
                <PowerOff className="mr-1.5 size-3.5" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-1.5 size-3.5" />
                Activate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CoursesGridProps {
  courses: Course[];
  searchQuery: string;
  onEdit: (course: Course) => void;
  onToggleActive: (course: Course) => void;
  onAdd: () => void;
}

/**
 * Grid layout for displaying course cards
 */
export function CoursesGrid({
  courses,
  searchQuery,
  onEdit,
  onToggleActive,
  onAdd,
}: CoursesGridProps) {
  if (courses.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <GraduationCap />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No Courses</EmptyTitle>
          <EmptyDescription>
            {searchQuery
              ? "No courses match your search."
              : "No courses have been added yet."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            Add Course
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
}
