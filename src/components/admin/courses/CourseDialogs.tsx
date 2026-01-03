"use client";

import { Loader2, Check } from "lucide-react";

import type { Course, Instructor, Semester } from "@midori/types/admin";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Label } from "@midori/components/ui/label";
import { Textarea } from "@midori/components/ui/textarea";
import { Badge } from "@midori/components/ui/badge";
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

// ============================================================================
// Add Course Dialog
// ============================================================================

interface AddCourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formCode: string;
  formTitle: string;
  formDescription: string;
  onFormCodeChange: (value: string) => void;
  onFormTitleChange: (value: string) => void;
  onFormDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AddCourseDialog({
  isOpen,
  onOpenChange,
  formCode,
  formTitle,
  formDescription,
  onFormCodeChange,
  onFormTitleChange,
  onFormDescriptionChange,
  onSubmit,
  isSubmitting,
}: AddCourseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create a new course with a code, title, and optional description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">
              Course Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="e.g., CS101"
              value={formCode}
              onChange={(e) => onFormCodeChange(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Introduction to Computer Science"
              value={formTitle}
              onChange={(e) => onFormTitleChange(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter course description..."
              value={formDescription}
              onChange={(e) => onFormDescriptionChange(e.target.value)}
              rows={3}
            />
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
            Add Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Edit Course Dialog
// ============================================================================

interface EditCourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  formCode: string;
  formTitle: string;
  formDescription: string;
  onFormCodeChange: (value: string) => void;
  onFormTitleChange: (value: string) => void;
  onFormDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoadingDetails: boolean;
  // Instructors
  allInstructors: Instructor[];
  selectedInstructorIds: number[];
  onToggleInstructor: (id: number) => void;
  // Semesters
  allSemesters: Semester[];
  selectedSemesterIds: number[];
  onToggleSemester: (id: number) => void;
}

export function EditCourseDialog({
  isOpen,
  onOpenChange,
  formCode,
  formTitle,
  formDescription,
  onFormCodeChange,
  onFormTitleChange,
  onFormDescriptionChange,
  onSubmit,
  isSubmitting,
  isLoadingDetails,
  allInstructors,
  selectedInstructorIds,
  onToggleInstructor,
  allSemesters,
  selectedSemesterIds,
  onToggleSemester,
}: EditCourseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update course details, instructors, and semesters.
          </DialogDescription>
        </DialogHeader>
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="instructors">Instructors</TabsTrigger>
              <TabsTrigger value="semesters">Semesters</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">
                  Course Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-code"
                  placeholder="e.g., CS101"
                  value={formCode}
                  onChange={(e) => onFormCodeChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Introduction to Computer Science"
                  value={formTitle}
                  onChange={(e) => onFormTitleChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter course description..."
                  value={formDescription}
                  onChange={(e) => onFormDescriptionChange(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="instructors" className="pt-4">
              <SelectableList
                items={allInstructors}
                selectedIds={selectedInstructorIds}
                onToggle={onToggleInstructor}
                renderItem={(instructor) => (
                  <>
                    <p className="font-medium">{instructor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {instructor.email}
                    </p>
                  </>
                )}
                emptyMessage="No instructors available"
              />
            </TabsContent>
            <TabsContent value="semesters" className="pt-4">
              <SelectableList
                items={allSemesters}
                selectedIds={selectedSemesterIds}
                onToggle={onToggleSemester}
                renderItem={(semester) => (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{semester.name}</p>
                    {semester.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                )}
                emptyMessage="No semesters available"
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
// Selectable List (reusable for instructors/semesters/courses)
// ============================================================================

interface SelectableListProps<T extends { id: number }> {
  items: T[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function SelectableList<T extends { id: number }>({
  items,
  selectedIds,
  onToggle,
  renderItem,
  emptyMessage = "No items available",
}: SelectableListProps<T>) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-colors ${
            selectedIds.includes(item.id)
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50"
          }`}
          onClick={() => onToggle(item.id)}
        >
          <div>{renderItem(item)}</div>
          {selectedIds.includes(item.id) && (
            <Check className="size-5 text-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
