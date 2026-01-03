"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Semester, Course } from "@midori/types/admin";
import { formatDateForInput } from "@midori/lib/format";
import { api, fetchClinet } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import { LoadingState } from "@midori/components/shared/LoadingState";
import { SearchInput } from "@midori/components/shared/SearchInput";
import { Pagination } from "@midori/components/shared/Pagination";
import { usePagination, useSelection } from "@midori/hooks/useCommon";
import { SemestersGrid } from "./semesters/SemesterCard";
import {
  AddSemesterDialog,
  EditSemesterDialog,
  DeleteSemesterDialog,
} from "./semesters/SemesterDialogs";

// ============================================================================
// Semester Form State Hook
// ============================================================================

function useSemesterForm() {
  const [formName, setFormName] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const reset = useCallback(() => {
    setFormName("");
    setFormStartDate("");
    setFormEndDate("");
  }, []);

  const setFromSemester = useCallback((semester: Semester) => {
    setFormName(semester.name);
    setFormStartDate(formatDateForInput(semester.startDate));
    setFormEndDate(formatDateForInput(semester.endDate));
  }, []);

  const isValid =
    formName.trim() !== "" && formStartDate !== "" && formEndDate !== "";

  return {
    formName,
    formStartDate,
    formEndDate,
    setFormName,
    setFormStartDate,
    setFormEndDate,
    reset,
    setFromSemester,
    isValid,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export function SemestersClient() {
  const { page, pageSize, goToPage, resetPage } = usePagination(1, 10);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null,
  );
  const [isLoadingSemesterDetails, setIsLoadingSemesterDetails] =
    useState(false);

  // Form state
  const semesterForm = useSemesterForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection state for courses
  const courseSelection = useSelection<number>([]);

  // Data fetching
  const { data, isLoading, refetch } = api.useQuery(
    "get",
    "/api/academic/semesters",
    {
      params: {
        query: { page, pageSize, name: searchQuery || undefined },
      },
    },
  );

  const semesters = (data?.values || []) as Semester[];
  const totalPages = data?.totalPages || 1;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleOpenAddDialog = useCallback(() => {
    semesterForm.reset();
    setIsAddDialogOpen(true);
  }, [semesterForm]);

  const handleOpenEditDialog = useCallback(
    async (semester: Semester) => {
      setSelectedSemester(semester);
      semesterForm.setFromSemester(semester);
      setIsLoadingSemesterDetails(true);
      setIsEditDialogOpen(true);

      try {
        const { data, error } = await fetchClinet.GET(
          "/api/academic/semesters/{semesterId}",
          { params: { path: { semesterId: semester.id } } },
        );

        if (error || !data) {
          toast.error("Failed to load semester details");
          return;
        }

        courseSelection.selectAll(
          (data.courses || []).map((c: Course) => c.id),
        );
      } catch {
        toast.error("An error occurred while loading semester details");
      } finally {
        setIsLoadingSemesterDetails(false);
      }
    },
    [semesterForm, courseSelection],
  );

  const handleOpenDeleteDialog = useCallback((semester: Semester) => {
    setSelectedSemester(semester);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleAddSemester = useCallback(async () => {
    if (!semesterForm.isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await fetchClinet.POST("/api/academic/semesters", {
        body: {
          name: semesterForm.formName,
          startDate: semesterForm.formStartDate,
          endDate: semesterForm.formEndDate,
        },
      });

      if (error) {
        toast.error("Failed to create semester");
        return;
      }

      toast.success("Semester created successfully");
      setIsAddDialogOpen(false);
      semesterForm.reset();
      refetch();
    } catch {
      toast.error("An error occurred while creating the semester");
    } finally {
      setIsSubmitting(false);
    }
  }, [semesterForm, refetch]);

  const handleEditSemester = useCallback(async () => {
    if (!selectedSemester || !semesterForm.isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update semester details
      const { error: detailsError } = await fetchClinet.PATCH(
        "/api/academic/semesters/{semesterId}",
        {
          params: { path: { semesterId: selectedSemester.id } },
          body: {
            name: semesterForm.formName,
            startDate: semesterForm.formStartDate,
            endDate: semesterForm.formEndDate,
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
          params: { path: { semesterId: selectedSemester.id } },
          body: { courseIds: courseSelection.selected },
        },
      );

      if (coursesError) {
        toast.error("Failed to update courses");
        return;
      }

      toast.success("Semester updated successfully");
      setIsEditDialogOpen(false);
      semesterForm.reset();
      refetch();
    } catch {
      toast.error("An error occurred while updating the semester");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSemester, semesterForm, courseSelection, refetch]);

  const handleDeleteSemester = useCallback(async () => {
    if (!selectedSemester) return;

    setIsSubmitting(true);
    try {
      const { error } = await fetchClinet.DELETE(
        "/api/academic/semesters/{semesterId}",
        { params: { path: { semesterId: selectedSemester.id } } },
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
  }, [selectedSemester, refetch]);

  const handleSetAsCurrent = useCallback(
    async (semester: Semester) => {
      if (semester.isCurrent) return;

      try {
        const { error } = await fetchClinet.PATCH(
          "/api/academic/semesters/{semesterId}",
          {
            params: { path: { semesterId: semester.id } },
            body: { isCurrent: true },
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

  if (isLoading) {
    return <LoadingState variant="cards" count={4} />;
  }

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          placeholder="Search semesters..."
          value={searchQuery}
          onChange={handleSearchChange}
          containerClassName="max-w-md flex-1"
        />
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 size-4" />
          Add Semester
        </Button>
      </div>

      {/* Semesters Grid */}
      <SemestersGrid
        semesters={semesters}
        searchQuery={searchQuery}
        onEdit={handleOpenEditDialog}
        onDelete={handleOpenDeleteDialog}
        onSetAsCurrent={handleSetAsCurrent}
        onAdd={handleOpenAddDialog}
      />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      {/* Dialogs */}
      <AddSemesterDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formName={semesterForm.formName}
        formStartDate={semesterForm.formStartDate}
        formEndDate={semesterForm.formEndDate}
        onFormNameChange={semesterForm.setFormName}
        onFormStartDateChange={semesterForm.setFormStartDate}
        onFormEndDateChange={semesterForm.setFormEndDate}
        onSubmit={handleAddSemester}
        isSubmitting={isSubmitting}
      />

      <EditSemesterDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formName={semesterForm.formName}
        formStartDate={semesterForm.formStartDate}
        formEndDate={semesterForm.formEndDate}
        onFormNameChange={semesterForm.setFormName}
        onFormStartDateChange={semesterForm.setFormStartDate}
        onFormEndDateChange={semesterForm.setFormEndDate}
        onSubmit={handleEditSemester}
        isSubmitting={isSubmitting}
        isLoadingDetails={isLoadingSemesterDetails}
        selectedCourseIds={courseSelection.selected}
        onToggleCourse={courseSelection.toggle}
      />

      <DeleteSemesterDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        semester={selectedSemester}
        onConfirm={handleDeleteSemester}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
