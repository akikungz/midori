"use client";

import { Loader2, User, BookOpen } from "lucide-react";

import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midori/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@midori/components/ui/tabs";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { SelectableAutocomplete } from "../courses/CourseDialogs";
import type { Instructor } from "./InstructorCard";

// ============================================================================
// Edit Instructor Dialog
// ============================================================================

interface EditInstructorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor | null;
  editRole: "ADMIN" | "INSTRUCTOR";
  onRoleChange: (role: "ADMIN" | "INSTRUCTOR") => void;
  isRoleLocked: boolean;
  selectedCourseIds: number[];
  onToggleCourse: (courseId: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoadingDetails: boolean;
}

export function EditInstructorDialog({
  isOpen,
  onOpenChange,
  instructor,
  editRole,
  onRoleChange,
  isRoleLocked,
  selectedCourseIds,
  onToggleCourse,
  onSubmit,
  isSubmitting,
  isLoadingDetails,
}: EditInstructorDialogProps) {
  // Use autocomplete for courses selection
  const coursesAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/courses",
    limit: 50,
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Instructor</DialogTitle>
          <DialogDescription>
            Update details for {instructor?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">
              <User className="mr-1.5 size-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex-1">
              <BookOpen className="mr-1.5 size-4" />
              Courses
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={instructor?.name || ""} disabled />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input value={instructor?.email || ""} disabled />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={editRole}
                  onValueChange={(v) =>
                    onRoleChange(v as "ADMIN" | "INSTRUCTOR")
                  }
                  disabled={isRoleLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {isRoleLocked ? (
                  <p className="text-xs text-muted-foreground">
                    You cannot change your own role.
                  </p>
                ) : null}
              </Field>
            </FieldGroup>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-4">
            {isLoadingDetails ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <SelectableAutocomplete
                search={coursesAutocomplete.search}
                onSearchChange={coursesAutocomplete.setSearch}
                options={coursesAutocomplete.options}
                isLoading={coursesAutocomplete.isLoading}
                selectedIds={selectedCourseIds}
                onToggle={onToggleCourse}
                searchPlaceholder="Search courses..."
                emptyMessage="No courses found"
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Promote to Admin Dialog
// ============================================================================

interface PromoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function PromoteDialog({
  isOpen,
  onOpenChange,
  instructor,
  onConfirm,
  isSubmitting,
}: PromoteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to promote{" "}
            <span className="font-semibold">{instructor?.name}</span> to Admin?
            This will give them full administrative privileges including the
            ability to manage other users, courses, and system settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Promote to Admin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
