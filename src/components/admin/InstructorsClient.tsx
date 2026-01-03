"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Edit,
  Shield,
  Loader2,
  User,
  BookOpen,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClinet } from "@midori/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midori/components/ui/tabs";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import {
  getRoleDisplayName,
  getRoleBadgeVariant,
  type Role,
} from "@midori/lib/roles";
import { cn } from "@midori/lib/utils";

type Instructor = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
};

type Course = {
  id: number;
  code: string;
  title: string;
  isActive: boolean;
};

export function InstructorsClient() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch all courses for assignment
  const { data: coursesData } = api.useQuery("get", "/api/academic/courses", {
    params: {
      query: { page: 1, pageSize: 100 },
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
  const courses: Course[] = coursesData?.values || [];

  // Debounced search handler
  const handleSearchChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQuery(value);
        setPage(1); // Reset to first page when searching
      }, 300);
    };
  }, []);

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
      await fetchClinet.PATCH(
        "/api/academic/instructors/{instructorId}",
        {
          params: {
            path: { instructorId: selectedInstructor.id },
          },
          body: {
            role: editRole,
            courseIds: selectedCourseIds,
          },
        },
      );

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
      await fetchClinet.PATCH(
        "/api/academic/instructors/{instructorId}",
        {
          params: {
            path: { instructorId: instructorToPromote.id },
          },
          body: {
            role: "ADMIN",
          },
        },
      );

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
          onChange={(e) => handleSearchChange(e.target.value)}
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
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <BookOpen className="mx-auto mb-2 size-8 opacity-50" />
                  <p>No courses available</p>
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                  {courses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => toggleCourseSelection(course.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div>
                          <p className="font-medium">{course.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.title}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30",
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedCourseIds.length} course
                {selectedCourseIds.length !== 1 ? "s" : ""} selected
              </p>
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
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
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
              <span className="font-semibold">
                {instructorToPromote?.name}
              </span>{" "}
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
              {isPromoting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Promote to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
