"use client";

import { useState } from "react";
import { Mail, Plus, Trash2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { api, fetchClinet } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Card, CardHeader } from "@midori/components/ui/card";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midori/components/ui/alert-dialog";

export function MailingListClient() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = api.useQuery(
    "get",
    "/api/academic/mailing-list",
    {
      params: {
        query: { page: 1, pageSize: 100 },
      },
    },
  );

  const mailingList = data?.values || [];

  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) return;
    setIsSubmitting(true);
    try {
      await fetchClinet.POST("/api/academic/mailing-list", {
        body: { email: newEmail },
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/academic/mailing-list"],
      });
      setNewEmail("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add email:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmail = async (mailingId: number) => {
    try {
      await fetchClinet.DELETE("/api/academic/mailing-list/{mailingId}", {
        params: { path: { mailingId } },
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/academic/mailing-list"],
      });
    } catch (error) {
      console.error("Failed to delete email:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
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
        <Input placeholder="Search emails..." className="pl-9" />
      </div>

      {/* Mailing List */}
      {mailingList.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Mail />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Emails</EmptyTitle>
            <EmptyDescription>
              No email addresses in the mailing list yet.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add First Email
          </Button>
        </Empty>
      ) : (
        <div className="space-y-3">
          {mailingList.map((entry) => (
            <Card
              key={entry.id}
              className="transition-colors hover:border-primary/50"
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="font-medium">{entry.email}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Email</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove{" "}
                          <strong>{entry.email}</strong> from the mailing list?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEmail(entry.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Add Email Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email to Mailing List</DialogTitle>
            <DialogDescription>
              Add a new instructor email address to receive notifications
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="instructor@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </Field>
            <Button
              className="w-full"
              disabled={!newEmail || !newEmail.includes("@") || isSubmitting}
              onClick={handleAddEmail}
            >
              {isSubmitting ? "Adding..." : "Add Email"}
            </Button>
          </FieldGroup>
        </DialogContent>
      </Dialog>
    </>
  );
}
