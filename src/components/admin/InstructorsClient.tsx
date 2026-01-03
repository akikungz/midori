"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Edit,
  Shield,
  Loader2,
  User,
  BookOpen,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClinet } from "@midori/lib/api";
import { useDebounce } from "@midori/hooks/useCommon";
import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Card, CardHeader } from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import { Avatar, AvatarFallback } from "@midori/components/ui/avatar";
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
import {
  getRoleDisplayName,
  getRoleBadgeVariant,
  type Role,
} from "@midori/lib/roles";
import { SelectableAutocomplete } from "./courses/CourseDialogs";

type Instructor = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
};

export function InstructorsClient() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [inputValue, setInputValue] = useState("");
  const searchQuery = useDebounce(inputValue, 300);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [editRole, setEditRole] = useState<"ADMIN" | "INSTRUCTOR">(
    "INSTRUCTOR",
  );
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promote dialog state
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [instructorToPromote, setInstructorToPromote] =
    useState<Instructor | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // Use autocomplete for courses selection in edit dialog
  const coursesAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/courses",
    limit: 50,
    enabled: editDialogOpen,
  });

  // Reset page when search query changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    setPage(1);
  }, [inputValue]);

  // Use API search params for server-side filtering
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
      setSelectedCourseIds(instructorDetails.courses.map((c) => c.id));
    }
  }, [instructorDetails]);

  const instructors = data?.values || [];
  const totalPages = data?.totalPages || 1;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setEditRole(instructor.role === "ADMIN" ? "ADMIN" : "INSTRUCTOR");
    setSelectedCourseIds([]);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedInstructor(null);
      setSelectedCourseIds([]);
    }
    setEditDialogOpen(open);
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleEditSubmit = async () => {
    if (!selectedInstructor) return;

    setIsSubmitting(true);
    try {
      await fetchClinet.PATCH("/api/academic/instructors/{instructorId}", {
        params: {
          path: { instructorId: selectedInstructor.id },
        },
        body: {
          role: editRole,
          courseIds: selectedCourseIds,
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["get", "/api/academic/instructors"],
      });

      toast.success("Instructor updated successfully");
      setEditDialogOpen(false);
      setSelectedInstructor(null);
      setSelectedCourseIds([]);
    } catch (error) {
      console.error("Failed to update instructor:", error);
      toast.error("Failed to update instructor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoteClick = (instructor: Instructor) => {
    setInstructorToPromote(instructor);
    setPromoteDialogOpen(true);
  };

  const handlePromoteConfirm = async () => {
    if (!instructorToPromote) return;

    setIsPromoting(true);
    try {
      await fetchClinet.PATCH("/api/academic/instructors/{instructorId}", {
        params: {
          path: { instructorId: instructorToPromote.id },
        },
        body: {
          role: "ADMIN",
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["get", "/api/academic/instructors"],
      });

      toast.success(`${instructorToPromote.name} has been promoted to Admin`);
      setPromoteDialogOpen(false);
      setInstructorToPromote(null);
    } catch (error) {
      console.error("Failed to promote instructor:", error);
      toast.error("Failed to promote instructor");
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search instructors by name..."
          className="pl-9"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {/* Instructors List */}
      {instructors.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Instructors</EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? "No instructors found matching your search."
                : "No instructors found in the system."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {instructors.map((instructor) => (
            <Card
              key={instructor.id}
              className="transition-colors hover:border-primary/50"
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(instructor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{instructor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {instructor.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={getRoleBadgeVariant(instructor.role as Role)}
                    >
                      {getRoleDisplayName(instructor.role as Role)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(instructor)}
                    >
                      <Edit className="mr-1.5 size-3.5" />
                      Edit
                    </Button>
                    {instructor.role !== "ADMIN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromoteClick(instructor)}
                      >
                        <Shield className="mr-1.5 size-3.5" />
                        Promote to Admin
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
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

      {/* Edit Instructor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Instructor</DialogTitle>
            <DialogDescription>
              Update details for {selectedInstructor?.name}
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
                  <Input value={selectedInstructor?.name || ""} disabled />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input value={selectedInstructor?.email || ""} disabled />
                </Field>
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={editRole}
                    onValueChange={(v) =>
                      setEditRole(v as "ADMIN" | "INSTRUCTOR")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onToggle={toggleCourseSelection}
                  searchPlaceholder="Search courses..."
                  emptyMessage="No courses found"
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleEditDialogClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote to Admin Confirmation Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote{" "}
              <span className="font-semibold">{instructorToPromote?.name}</span>{" "}
              to Admin? This will give them full administrative privileges
              including the ability to manage other users, courses, and system
              settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPromoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromoteConfirm}
              disabled={isPromoting}
            >
              {isPromoting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Promote to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
