"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Course, Instructor, Semester } from "@midori/types/admin";
import { api, fetchClient } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import { LoadingState } from "@midori/components/shared/LoadingState";
import { SearchInput } from "@midori/components/shared/SearchInput";
import { Pagination } from "@midori/components/shared/Pagination";
import { usePagination, useSelection } from "@midori/hooks/useCommon";
import { CoursesGrid } from "./courses/CourseCard";
import { AddCourseDialog, EditCourseDialog } from "./courses/CourseDialogs";

// ============================================================================
// Course Form State Hook
// ============================================================================

function useCourseForm() {
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const reset = useCallback(() => {
    setFormCode("");
    setFormTitle("");
    setFormDescription("");
  }, []);

  const setFromCourse = useCallback((course: Course) => {
    setFormCode(course.code);
    setFormTitle(course.title);
    setFormDescription(course.description || "");
  }, []);

  const isValid = formCode.trim() !== "" && formTitle.trim() !== "";

  return {
    formCode,
    formTitle,
    formDescription,
    setFormCode,
    setFormTitle,
    setFormDescription,
    reset,
    setFromCourse,
    isValid,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export function CoursesClient() {
  const { page, pageSize, goToPage, resetPage } = usePagination(1, 12);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false);

  // Form state
  const courseForm = useCourseForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection states for instructors and semesters
  const instructorSelection = useSelection<number>([]);
  const semesterSelection = useSelection<number>([]);

  // Data fetching
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

  const courses = (data?.values || []) as Course[];
  const totalPages = data?.totalPages || 1;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleOpenAddDialog = useCallback(() => {
    courseForm.reset();
    setIsAddDialogOpen(true);
  }, [courseForm]);

  const handleOpenEditDialog = useCallback(
    async (course: Course) => {
      setSelectedCourse(course);
      courseForm.setFromCourse(course);
      setIsLoadingCourseDetails(true);
      setIsEditDialogOpen(true);

      try {
        const { data, error } = await fetchClient.GET(
          "/api/academic/courses/{courseId}",
          { params: { path: { courseId: course.id } } },
        );

        if (error || !data) {
          toast.error("Failed to load course details");
          return;
        }

        instructorSelection.selectAll(
          (data.instructors || []).map((i: Instructor) => i.id),
        );
        semesterSelection.selectAll(
          (data.semesters || []).map((s: Semester) => s.id),
        );
      } catch {
        toast.error("An error occurred while loading course details");
      } finally {
        setIsLoadingCourseDetails(false);
      }
    },
    [courseForm, instructorSelection, semesterSelection],
  );

  const handleAddCourse = useCallback(async () => {
    if (!courseForm.isValid) {
      toast.error("Please fill in required fields (Code and Title)");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await fetchClient.POST("/api/academic/courses", {
        body: {
          code: courseForm.formCode,
          title: courseForm.formTitle,
          description: courseForm.formDescription || undefined,
        },
      });

      if (error) {
        toast.error("Failed to create course");
        return;
      }

      toast.success("Course created successfully");
      setIsAddDialogOpen(false);
      courseForm.reset();
      refetch();
    } catch {
      toast.error("An error occurred while creating the course");
    } finally {
      setIsSubmitting(false);
    }
  }, [courseForm, refetch]);

  const handleEditCourse = useCallback(async () => {
    if (!selectedCourse || !courseForm.isValid) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update course details
      const { error: detailsError } = await fetchClient.PATCH(
        "/api/academic/courses/{courseId}",
        {
          params: { path: { courseId: selectedCourse.id } },
          body: {
            code: courseForm.formCode,
            title: courseForm.formTitle,
            description: courseForm.formDescription || undefined,
          },
        },
      );

      if (detailsError) {
        toast.error("Failed to update course details");
        return;
      }

      // Update instructors
      const { error: instructorsError } = await fetchClient.PATCH(
        "/api/academic/courses/{courseId}/instructors",
        {
          params: { path: { courseId: selectedCourse.id } },
          body: { instructorIds: instructorSelection.selected },
        },
      );

      if (instructorsError) {
        toast.error("Failed to update instructors");
        return;
      }

      // Update semesters
      const { error: semestersError } = await fetchClient.PATCH(
        "/api/academic/courses/{courseId}/semesters",
        {
          params: { path: { courseId: selectedCourse.id } },
          body: { semesterIds: semesterSelection.selected },
        },
      );

      if (semestersError) {
        toast.error("Failed to update semesters");
        return;
      }

      toast.success("Course updated successfully");
      setIsEditDialogOpen(false);
      courseForm.reset();
      refetch();
    } catch {
      toast.error("An error occurred while updating the course");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedCourse,
    courseForm,
    instructorSelection,
    semesterSelection,
    refetch,
  ]);

  const handleToggleActive = useCallback(
    async (course: Course) => {
      try {
        const { error } = await fetchClient.PATCH(
          "/api/academic/courses/{courseId}",
          {
            params: { path: { courseId: course.id } },
            body: { isActive: !course.isActive },
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
    },
    [refetch],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      resetPage();
    },
    [resetPage],
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          placeholder="Search by course code..."
          value={searchQuery}
          onChange={handleSearchChange}
          containerClassName="max-w-md flex-1"
          disabled={false}
          showClear={!isLoading}
        />
        <Button onClick={handleOpenAddDialog} disabled={isLoading}>
          <Plus className="mr-2 size-4" />
          Add Course
        </Button>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <LoadingState variant="cards" count={6} />
      ) : (
        <CoursesGrid
          courses={courses}
          searchQuery={searchQuery}
          onEdit={handleOpenEditDialog}
          onToggleActive={handleToggleActive}
          onAdd={handleOpenAddDialog}
        />
      )}

      {/* Pagination */}
      {!isLoading && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}

      {/* Dialogs */}
      <AddCourseDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formCode={courseForm.formCode}
        formTitle={courseForm.formTitle}
        formDescription={courseForm.formDescription}
        onFormCodeChange={courseForm.setFormCode}
        onFormTitleChange={courseForm.setFormTitle}
        onFormDescriptionChange={courseForm.setFormDescription}
        onSubmit={handleAddCourse}
        isSubmitting={isSubmitting}
      />

      <EditCourseDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        course={selectedCourse}
        formCode={courseForm.formCode}
        formTitle={courseForm.formTitle}
        formDescription={courseForm.formDescription}
        onFormCodeChange={courseForm.setFormCode}
        onFormTitleChange={courseForm.setFormTitle}
        onFormDescriptionChange={courseForm.setFormDescription}
        onSubmit={handleEditCourse}
        isSubmitting={isSubmitting}
        isLoadingDetails={isLoadingCourseDetails}
        selectedInstructorIds={instructorSelection.selected}
        onToggleInstructor={instructorSelection.toggle}
        selectedSemesterIds={semesterSelection.selected}
        onToggleSemester={semesterSelection.toggle}
      />
    </>
  );
}
