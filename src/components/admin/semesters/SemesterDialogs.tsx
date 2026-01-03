"use client";

import { Loader2 } from "lucide-react";

import type { Course, Semester } from "@midori/types/admin";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Label } from "@midori/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@midori/components/ui/tabs";
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
import { SelectableList } from "../courses/CourseDialogs";

// ============================================================================
// Add Semester Dialog
// ============================================================================

interface AddSemesterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formName: string;
  formStartDate: string;
  formEndDate: string;
  onFormNameChange: (value: string) => void;
  onFormStartDateChange: (value: string) => void;
  onFormEndDateChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AddSemesterDialog({
  isOpen,
  onOpenChange,
  formName,
  formStartDate,
  formEndDate,
  onFormNameChange,
  onFormStartDateChange,
  onFormEndDateChange,
  onSubmit,
  isSubmitting,
}: AddSemesterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
          <DialogDescription>
            Create a new academic semester with a name and date range.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Fall 2026"
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formStartDate}
                onChange={(e) => onFormStartDateChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formEndDate}
                onChange={(e) => onFormEndDateChange(e.target.value)}
              />
            </div>
          </div>
        </div>
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
            Add Semester
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Edit Semester Dialog
// ============================================================================

interface EditSemesterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formName: string;
  formStartDate: string;
  formEndDate: string;
  onFormNameChange: (value: string) => void;
  onFormStartDateChange: (value: string) => void;
  onFormEndDateChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoadingDetails: boolean;
  allCourses: Course[];
  selectedCourseIds: number[];
  onToggleCourse: (id: number) => void;
}

export function EditSemesterDialog({
  isOpen,
  onOpenChange,
  formName,
  formStartDate,
  formEndDate,
  onFormNameChange,
  onFormStartDateChange,
  onFormEndDateChange,
  onSubmit,
  isSubmitting,
  isLoadingDetails,
  allCourses,
  selectedCourseIds,
  onToggleCourse,
}: EditSemesterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Semester</DialogTitle>
          <DialogDescription>
            Update semester details and assign courses.
          </DialogDescription>
        </DialogHeader>
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Fall 2026"
                  value={formName}
                  onChange={(e) => onFormNameChange(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => onFormStartDateChange(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => onFormEndDateChange(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="courses" className="pt-4">
              <SelectableList
                items={allCourses}
                selectedIds={selectedCourseIds}
                onToggle={onToggleCourse}
                renderItem={(course) => (
                  <>
                    <p className="font-medium">{course.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.title}
                    </p>
                  </>
                )}
                emptyMessage="No courses available"
              />
            </TabsContent>
          </Tabs>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || isLoadingDetails}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Delete Semester Dialog
// ============================================================================

interface DeleteSemesterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  semester: Semester | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DeleteSemesterDialog({
  isOpen,
  onOpenChange,
  semester,
  onConfirm,
  isSubmitting,
}: DeleteSemesterDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Semester</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{semester?.name}&quot;? This
            action cannot be undone and may affect associated courses and
            instances.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
