"use client";

import { useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Edit,
  Check,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { api, fetchClinet } from "@midori/lib/api";
import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Label } from "@midori/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
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
import { SelectableAutocomplete } from "./courses/CourseDialogs";

type Semester = {
  id: number;
  name: string;
  startDate: Record<string, never> | string | number;
  endDate: Record<string, never> | string | number;
  isCurrent: boolean;
  createdAt?: Record<string, never> | string | number;
  updatedAt?: Record<string, never> | string | number;
};

type Course = {
  id: number;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
};

export function SemestersClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null,
  );

  // Form states
  const [formName, setFormName] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSemesterDetails, setIsLoadingSemesterDetails] =
    useState(false);

  // Courses assignment states
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  // Use autocomplete for courses selection in edit dialog
  const coursesAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/courses",
    limit: 50,
    enabled: isEditDialogOpen,
  });

  const { data, isLoading, refetch } = api.useQuery(
    "get",
    "/api/academic/semesters",
    {
      params: {
        query: { page, pageSize, name: searchQuery || undefined },
      },
    },
  );

  const semesters = data?.values || [];
  const totalPages = data?.totalPages || 1;

  const formatDate = (date: string | number | Record<string, never>) => {
    if (typeof date === "string" || typeof date === "number") {
      return format(new Date(date), "MMM d, yyyy");
    }
    return "N/A";
  };

  const formatDateForInput = (
    date: string | number | Record<string, never>,
  ) => {
    if (typeof date === "string" || typeof date === "number") {
      return format(new Date(date), "yyyy-MM-dd");
    }
    return "";
  };

  const resetForm = () => {
    setFormName("");
    setFormStartDate("");
    setFormEndDate("");
    setSelectedSemester(null);
    setSelectedCourseIds([]);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = async (semester: Semester) => {
    setSelectedSemester(semester);
    setFormName(semester.name);
    setFormStartDate(formatDateForInput(semester.startDate));
    setFormEndDate(formatDateForInput(semester.endDate));
    setIsLoadingSemesterDetails(true);
    setIsEditDialogOpen(true);

    try {
      const { data, error } = await fetchClinet.GET(
        "/api/academic/semesters/{semesterId}",
        {
          params: {
            path: { semesterId: semester.id },
          },
        },
      );

      if (error || !data) {
        toast.error("Failed to load semester details");
        return;
      }

      setSelectedCourseIds((data.courses || []).map((c: Course) => c.id));
    } catch {
      toast.error("An error occurred while loading semester details");
    } finally {
      setIsLoadingSemesterDetails(false);
    }
  };

  const handleOpenDeleteDialog = (semester: Semester) => {
    setSelectedSemester(semester);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSemester = async () => {
    if (!formName || !formStartDate || !formEndDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await fetchClinet.POST("/api/academic/semesters", {
        body: {
          name: formName,
          startDate: formStartDate,
          endDate: formEndDate,
        },
      });

      if (error) {
        toast.error("Failed to create semester");
        return;
      }

      toast.success("Semester created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("An error occurred while creating the semester");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSemester = async () => {
    if (!selectedSemester || !formName || !formStartDate || !formEndDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update semester details
      const { error: detailsError } = await fetchClinet.PATCH(
        "/api/academic/semesters/{semesterId}",
        {
          params: {
            path: { semesterId: selectedSemester.id },
          },
          body: {
            name: formName,
            startDate: formStartDate,
            endDate: formEndDate,
          },
        },
      );

      if (detailsError) {
        toast.error("Failed to update semester details");
        return;
      }

      // Update courses
      const { error: coursesError } = await fetchClinet.PATCH(
        "/api/academic/semesters/{semesterId}/courses",
        {
          params: {
            path: { semesterId: selectedSemester.id },
          },
          body: {
            courseIds: selectedCourseIds,
          },
        },
      );

      if (coursesError) {
        toast.error("Failed to update courses");
        return;
      }

      toast.success("Semester updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("An error occurred while updating the semester");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleDeleteSemester = async () => {
    if (!selectedSemester) return;

    setIsSubmitting(true);
    try {
      const { error } = await fetchClinet.DELETE(
        "/api/academic/semesters/{semesterId}",
        {
          params: {
            path: { semesterId: selectedSemester.id },
          },
        },
      );

      if (error) {
        toast.error("Failed to delete semester");
        return;
      }

      toast.success("Semester deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedSemester(null);
      refetch();
    } catch {
      toast.error("An error occurred while deleting the semester");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetAsCurrent = async (semester: Semester) => {
    if (semester.isCurrent) return;

    try {
      const { error } = await fetchClinet.PATCH(
        "/api/academic/semesters/{semesterId}",
        {
          params: {
            path: { semesterId: semester.id },
          },
          body: {
            isCurrent: true,
          },
        },
      );

      if (error) {
        toast.error("Failed to set semester as current");
        return;
      }

      toast.success(`${semester.name} is now the current semester`);
      refetch();
    } catch {
      toast.error("An error occurred while updating the semester");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search semesters..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 size-4" />
          Add Semester
        </Button>
      </div>

      {/* Semesters Grid */}
      {semesters.length === 0 ? (
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
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 size-4" />
              Add Semester
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => (
            <Card
              key={semester.id}
              className="transition-colors hover:border-primary/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{semester.name}</CardTitle>
                    <CardDescription>
                      {formatDate(semester.startDate)} -{" "}
                      {formatDate(semester.endDate)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(semester)}
                  >
                    <Edit className="mr-1.5 size-3.5" />
                    Edit
                  </Button>
                  {!semester.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetAsCurrent(semester)}
                    >
                      <Star className="mr-1.5 size-3.5" />
                      Set Current
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(semester)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add Semester Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSemester} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Semester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Semester Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <DialogDescription>
              Update semester details and assign courses.
            </DialogDescription>
          </DialogHeader>
          {isLoadingSemesterDetails ? (
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
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-endDate">End Date</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="courses" className="pt-4">
                <SelectableAutocomplete
                  search={coursesAutocomplete.search}
                  onSearchChange={coursesAutocomplete.setSearch}
                  options={coursesAutocomplete.options}
                  isLoading={coursesAutocomplete.isLoading}
                  selectedIds={selectedCourseIds}
                  onToggle={toggleCourse}
                  searchPlaceholder="Search courses..."
                  emptyMessage="No courses found"
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSemester}
              disabled={isSubmitting || isLoadingSemesterDetails}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSemester?.name}"? This
              action cannot be undone and may affect associated courses and
              instances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSemester}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
