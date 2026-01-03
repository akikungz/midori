"use client";

import { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Edit,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";

import { api, fetchClinet } from "@midori/lib/api";
import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Label } from "@midori/components/ui/label";
import { Textarea } from "@midori/components/ui/textarea";
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
import { SelectableAutocomplete } from "./courses/CourseDialogs";

type Course = {
  id: number;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt?: Record<string, never> | string | number;
  updatedAt?: Record<string, never> | string | number;
};

type Instructor = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
};

type Semester = {
  id: number;
  name: string;
  startDate: Record<string, never> | string | number;
  endDate: Record<string, never> | string | number;
  isCurrent: boolean;
};

export function CoursesClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instructors assignment states
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<number[]>(
    [],
  );

  // Semesters assignment states
  const [selectedSemesterIds, setSelectedSemesterIds] = useState<number[]>([]);

  // Use autocomplete for instructors and semesters selection in edit dialog
  const instructorsAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/instructors",
    limit: 50,
    enabled: isEditDialogOpen,
  });

  const semestersAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/semesters",
    limit: 50,
    enabled: isEditDialogOpen,
  });

  const { data, isLoading, refetch } = api.useQuery(
    "get",
    "/api/academic/courses",
    {
      params: {
        query: {
          page,
          pageSize,
          code: searchQuery || undefined,
        },
      },
    },
  );

  const courses = data?.values || [];
  const totalPages = data?.totalPages || 1;

  const resetForm = () => {
    setFormCode("");
    setFormTitle("");
    setFormDescription("");
    setSelectedCourse(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = async (course: Course) => {
    setSelectedCourse(course);
    setFormCode(course.code);
    setFormTitle(course.title);
    setFormDescription(course.description || "");
    setIsLoadingCourseDetails(true);
    setIsEditDialogOpen(true);

    try {
      const { data, error } = await fetchClinet.GET(
        "/api/academic/courses/{courseId}",
        {
          params: {
            path: { courseId: course.id },
          },
        },
      );

      if (error || !data) {
        toast.error("Failed to load course details");
        return;
      }

      setSelectedInstructorIds(
        (data.instructors || []).map((i: Instructor) => i.id),
      );
      setSelectedSemesterIds((data.semesters || []).map((s: Semester) => s.id));
    } catch {
      toast.error("An error occurred while loading course details");
    } finally {
      setIsLoadingCourseDetails(false);
    }
  };

  const handleAddCourse = async () => {
    if (!formCode || !formTitle) {
      toast.error("Please fill in required fields (Code and Title)");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await fetchClinet.POST("/api/academic/courses", {
        body: {
          code: formCode,
          title: formTitle,
          description: formDescription || undefined,
        },
      });

      if (error) {
        toast.error("Failed to create course");
        return;
      }

      toast.success("Course created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("An error occurred while creating the course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse || !formCode || !formTitle) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update course details
      const { error: detailsError } = await fetchClinet.PATCH(
        "/api/academic/courses/{courseId}",
        {
          params: {
            path: { courseId: selectedCourse.id },
          },
          body: {
            code: formCode,
            title: formTitle,
            description: formDescription || undefined,
          },
        },
      );

      if (detailsError) {
        toast.error("Failed to update course details");
        return;
      }

      // Update instructors
      const { error: instructorsError } = await fetchClinet.PATCH(
        "/api/academic/courses/{courseId}/instructors",
        {
          params: {
            path: { courseId: selectedCourse.id },
          },
          body: {
            instructorIds: selectedInstructorIds,
          },
        },
      );

      if (instructorsError) {
        toast.error("Failed to update instructors");
        return;
      }

      // Update semesters
      const { error: semestersError } = await fetchClinet.PATCH(
        "/api/academic/courses/{courseId}/semesters",
        {
          params: {
            path: { courseId: selectedCourse.id },
          },
          body: {
            semesterIds: selectedSemesterIds,
          },
        },
      );

      if (semestersError) {
        toast.error("Failed to update semesters");
        return;
      }

      toast.success("Course updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("An error occurred while updating the course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      const { error } = await fetchClinet.PATCH(
        "/api/academic/courses/{courseId}",
        {
          params: {
            path: { courseId: course.id },
          },
          body: {
            isActive: !course.isActive,
          },
        },
      );

      if (error) {
        toast.error("Failed to update course status");
        return;
      }

      toast.success(
        `Course ${course.isActive ? "deactivated" : "activated"} successfully`,
      );
      refetch();
    } catch {
      toast.error("An error occurred while updating the course");
    }
  };

  const toggleInstructor = (instructorId: number) => {
    setSelectedInstructorIds((prev) =>
      prev.includes(instructorId)
        ? prev.filter((id) => id !== instructorId)
        : [...prev, instructorId],
    );
  };

  const toggleSemester = (semesterId: number) => {
    setSelectedSemesterIds((prev) =>
      prev.includes(semesterId)
        ? prev.filter((id) => id !== semesterId)
        : [...prev, semesterId],
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
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
            placeholder="Search by course code..."
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
          Add Course
        </Button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
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
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 size-4" />
              Add Course
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="transition-colors hover:border-primary/50"
            >
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(course)}
                  >
                    <Edit className="mr-1.5 size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(course)}
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

      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                onChange={(e) => setFormCode(e.target.value)}
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
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter course description..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
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
            <Button onClick={handleAddCourse} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course details, instructors, and semesters.
            </DialogDescription>
          </DialogHeader>
          {isLoadingCourseDetails ? (
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
                    onChange={(e) => setFormCode(e.target.value)}
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
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter course description..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
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
                  onToggle={toggleInstructor}
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
                  onToggle={toggleSemester}
                  searchPlaceholder="Search semesters..."
                  emptyMessage="No semesters found"
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
              onClick={handleEditCourse}
              disabled={isSubmitting || isLoadingCourseDetails}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
