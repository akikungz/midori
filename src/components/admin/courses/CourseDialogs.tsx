"use client";

import { Loader2, Check, Search } from "lucide-react";

import type { Course } from "@midori/types/admin";
import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Label } from "@midori/components/ui/label";
import { Switch } from "@midori/components/ui/switch";
import { Textarea } from "@midori/components/ui/textarea";
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
  formIsProjectBased: boolean;
  onFormCodeChange: (value: string) => void;
  onFormTitleChange: (value: string) => void;
  onFormDescriptionChange: (value: string) => void;
  onFormIsProjectBasedChange: (value: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AddCourseDialog({
  isOpen,
  onOpenChange,
  formCode,
  formTitle,
  formDescription,
  formIsProjectBased,
  onFormCodeChange,
  onFormTitleChange,
  onFormDescriptionChange,
  onFormIsProjectBasedChange,
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
          <div className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="is-project-based">Project-based course</Label>
              <p className="text-sm text-muted-foreground">
                Enable higher student request limits for this course.
              </p>
            </div>
            <Switch
              id="is-project-based"
              checked={formIsProjectBased}
              onCheckedChange={onFormIsProjectBasedChange}
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
  formIsProjectBased: boolean;
  onFormCodeChange: (value: string) => void;
  onFormTitleChange: (value: string) => void;
  onFormDescriptionChange: (value: string) => void;
  onFormIsProjectBasedChange: (value: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoadingDetails: boolean;
  // Instructors
  selectedInstructorIds: number[];
  onToggleInstructor: (id: number) => void;
  // Semesters
  selectedSemesterIds: number[];
  onToggleSemester: (id: number) => void;
}

export function EditCourseDialog({
  isOpen,
  onOpenChange,
  formCode,
  formTitle,
  formDescription,
  formIsProjectBased,
  onFormCodeChange,
  onFormTitleChange,
  onFormDescriptionChange,
  onFormIsProjectBasedChange,
  onSubmit,
  isSubmitting,
  isLoadingDetails,
  selectedInstructorIds,
  onToggleInstructor,
  selectedSemesterIds,
  onToggleSemester,
}: EditCourseDialogProps) {
  // Use autocomplete for instructors and semesters
  const instructorsAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/instructors",
    limit: 50,
    enabled: isOpen,
  });

  const semestersAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/semesters",
    limit: 50,
    enabled: isOpen,
  });

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
              <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-is-project-based">
                    Project-based course
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable higher student request limits for this course.
                  </p>
                </div>
                <Switch
                  id="edit-is-project-based"
                  checked={formIsProjectBased}
                  onCheckedChange={onFormIsProjectBasedChange}
                />
              </div>
            </TabsContent>
            <TabsContent value="instructors" className="pt-4">
              <SelectableAutocomplete
                search={instructorsAutocomplete.search}
                onSearchChange={instructorsAutocomplete.setSearch}
                options={instructorsAutocomplete.options}
                isLoading={instructorsAutocomplete.isLoading}
                selectedIds={selectedInstructorIds}
                onToggle={onToggleInstructor}
                searchPlaceholder="Search instructors..."
                emptyMessage="No instructors found"
              />
            </TabsContent>
            <TabsContent value="semesters" className="pt-4">
              <SelectableAutocomplete
                search={semestersAutocomplete.search}
                onSearchChange={semestersAutocomplete.setSearch}
                options={semestersAutocomplete.options}
                isLoading={semestersAutocomplete.isLoading}
                selectedIds={selectedSemesterIds}
                onToggle={onToggleSemester}
                searchPlaceholder="Search semesters..."
                emptyMessage="No semesters found"
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
// Selectable Autocomplete (with search input)
// ============================================================================

interface AutocompleteOption {
  id: number;
  label: string;
}

interface SelectableAutocompleteProps {
  search: string;
  onSearchChange: (value: string) => void;
  options: AutocompleteOption[];
  isLoading?: boolean;
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function SelectableAutocomplete({
  search,
  onSearchChange,
  options,
  isLoading = false,
  selectedIds,
  onToggle,
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
}: SelectableAutocompleteProps) {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Selected Count */}
      {selectedIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedIds.length} selected
        </p>
      )}

      {/* Options List */}
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : options.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          options.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                selectedIds.includes(option.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onToggle(option.id)}
            >
              <p className="font-medium">{option.label}</p>
              {selectedIds.includes(option.id) && (
                <Check className="size-5 text-primary" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Selectable List (legacy - for backward compatibility)
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
