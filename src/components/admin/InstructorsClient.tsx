"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClient, getApiErrorMessage } from "@midori/lib/api";
import { useSession } from "@midori/hooks/useSession";
import {
  usePagination,
  useDebounce,
  useSelection,
} from "@midori/hooks/useCommon";
import { LoadingState } from "@midori/components/shared/LoadingState";
import { SearchInput } from "@midori/components/shared/SearchInput";
import { Pagination } from "@midori/components/shared/Pagination";
import { InstructorsList, type Instructor } from "./instructors/InstructorCard";
import {
  EditInstructorDialog,
  PromoteDialog,
} from "./instructors/InstructorDialogs";

// ============================================================================
// Main Component
// ============================================================================

export function InstructorsClient() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useSession();
  const { page, pageSize, goToPage, resetPage } = usePagination(1, 10);
  const [inputValue, setInputValue] = useState("");
  const searchQuery = useDebounce(inputValue, 300);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [instructorToPromote, setInstructorToPromote] =
    useState<Instructor | null>(null);

  // Form state
  const [editRole, setEditRole] = useState<"ADMIN" | "INSTRUCTOR">(
    "INSTRUCTOR",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // Selection state for courses
  const courseSelection = useSelection<number>([]);

  // Reset page when search query changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset page on search change
  useEffect(() => {
    resetPage();
  }, [inputValue]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const { data, isLoading } = api.useQuery("get", "/api/academic/instructors", {
    params: {
      query: {
        page,
        pageSize,
        ...(searchQuery && { name: searchQuery }),
      },
    },
  });

  // Fetch instructor details when editing (to get assigned courses)
  const { data: instructorDetails, isLoading: isLoadingDetails } = api.useQuery(
    "get",
    "/api/academic/instructors/{instructorId}",
    {
      params: {
        path: { instructorId: selectedInstructor?.id ?? 0 },
      },
    },
    {
      enabled: !!selectedInstructor && editDialogOpen,
    },
  );

  // Update selected courses when instructor details are loaded
  useEffect(() => {
    if (instructorDetails?.courses) {
      courseSelection.selectAll(instructorDetails.courses.map((c) => c.id));
    }
  }, [instructorDetails?.courses, courseSelection.selectAll]);

  const instructors = (data?.values || []) as Instructor[];
  const totalPages = data?.totalPages || 1;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleOpenEditDialog = useCallback(
    (instructor: Instructor) => {
      setSelectedInstructor(instructor);
      setEditRole(instructor.role === "ADMIN" ? "ADMIN" : "INSTRUCTOR");
      courseSelection.clear();
      setEditDialogOpen(true);
    },
    [courseSelection],
  );

  const handleCloseEditDialog = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedInstructor(null);
        courseSelection.clear();
      }
      setEditDialogOpen(open);
    },
    [courseSelection],
  );

  const handleEditSubmit = useCallback(async () => {
    if (!selectedInstructor) return;

    const isEditingSelf = currentUser?.id === selectedInstructor.id;
    const isChangingOwnRole =
      isEditingSelf && editRole !== selectedInstructor.role;

    if (isChangingOwnRole) {
      toast.error("You cannot change your own role");
      return;
    }

    setIsSubmitting(true);
    const result = await fetchClient
      .PATCH("/api/academic/instructors/{instructorId}", {
        params: {
          path: { instructorId: selectedInstructor.id },
        },
        body: {
          role: editRole,
          courseIds: courseSelection.selected,
        },
      })
      .catch((error) => {
        console.error("Failed to update instructor:", error);
        toast.error(getApiErrorMessage(error) ?? "Failed to update instructor");
        return null;
      });

    setIsSubmitting(false);

    if (!result) {
      return;
    }

    const resultError = (result as { error?: unknown }).error;
    if (resultError) {
      toast.error(
        getApiErrorMessage(resultError) ?? "Failed to update instructor",
      );
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["get", "/api/academic/instructors"],
    });

    toast.success("Instructor updated successfully");
    setEditDialogOpen(false);
    setSelectedInstructor(null);
    courseSelection.clear();
  }, [
    selectedInstructor,
    currentUser?.id,
    editRole,
    courseSelection,
    queryClient,
  ]);

  const handleOpenPromoteDialog = useCallback((instructor: Instructor) => {
    setInstructorToPromote(instructor);
    setPromoteDialogOpen(true);
  }, []);

  const handlePromoteConfirm = useCallback(async () => {
    if (!instructorToPromote) return;

    setIsPromoting(true);
    const result = await fetchClient
      .PATCH("/api/academic/instructors/{instructorId}", {
        params: {
          path: { instructorId: instructorToPromote.id },
        },
        body: {
          role: "ADMIN",
        },
      })
      .catch((error) => {
        console.error("Failed to promote instructor:", error);
        toast.error(
          getApiErrorMessage(error) ?? "Failed to promote instructor",
        );
        return null;
      });

    setIsPromoting(false);

    if (!result) {
      return;
    }

    const resultError = (result as { error?: unknown }).error;
    if (resultError) {
      toast.error(
        getApiErrorMessage(resultError) ?? "Failed to promote instructor",
      );
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["get", "/api/academic/instructors"],
    });

    toast.success(`${instructorToPromote.name} has been promoted to Admin`);
    setPromoteDialogOpen(false);
    setInstructorToPromote(null);
  }, [instructorToPromote, queryClient]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Search */}
      <SearchInput
        placeholder="Search instructors by name..."
        value={inputValue}
        onChange={handleSearchChange}
        containerClassName="max-w-md"
        disabled={false}
        showClear={!isLoading}
      />

      {/* Instructors List */}
      {isLoading ? (
        <LoadingState variant="list" count={5} />
      ) : (
        <InstructorsList
          instructors={instructors}
          searchQuery={searchQuery}
          onEdit={handleOpenEditDialog}
          onPromote={handleOpenPromoteDialog}
        />
      )}

      {/* Pagination */}
      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}

      {/* Dialogs */}
      <EditInstructorDialog
        isOpen={editDialogOpen}
        onOpenChange={handleCloseEditDialog}
        instructor={selectedInstructor}
        editRole={editRole}
        onRoleChange={setEditRole}
        isRoleLocked={currentUser?.id === selectedInstructor?.id}
        selectedCourseIds={courseSelection.selected}
        onToggleCourse={courseSelection.toggle}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        isLoadingDetails={isLoadingDetails}
      />

      <PromoteDialog
        isOpen={promoteDialogOpen}
        onOpenChange={setPromoteDialogOpen}
        instructor={instructorToPromote}
        onConfirm={handlePromoteConfirm}
        isSubmitting={isPromoting}
      />
    </>
  );
}
