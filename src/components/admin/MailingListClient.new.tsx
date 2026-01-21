"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { api, fetchClient } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import { LoadingState } from "@midori/components/shared/LoadingState";
import { SearchInput } from "@midori/components/shared/SearchInput";
import { MailingList, type MailingEntry } from "./mailing-list/MailingCard";
import { AddEmailDialog } from "./mailing-list/MailingDialogs";

// ============================================================================
// Main Component
// ============================================================================

export function MailingListClient() {
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const { data, isLoading, refetch } = api.useQuery(
    "get",
    "/api/academic/mailing-list",
    {
      params: {
        query: { page: 1, pageSize: 100 },
      },
    },
  );

  const mailingList = (data?.values || []) as MailingEntry[];

  // Filter locally based on search query
  const filteredMailingList = searchQuery
    ? mailingList.filter((entry) =>
        entry.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : mailingList;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    setNewEmail("");
    setIsAddDialogOpen(true);
  }, []);

  const handleAddEmail = useCallback(async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await fetchClient.POST("/api/academic/mailing-list", {
        body: { email: newEmail },
      });

      if (error) {
        toast.error("Failed to add email");
        return;
      }

      toast.success("Email added successfully");
      setNewEmail("");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to add email:", error);
      toast.error("An error occurred while adding the email");
    } finally {
      setIsSubmitting(false);
    }
  }, [newEmail, refetch]);

  const handleDeleteEmail = useCallback(
    async (mailingId: number) => {
      try {
        const { error } = await fetchClient.DELETE(
          "/api/academic/mailing-list/{mailingId}",
          {
            params: { path: { mailingId } },
          },
        );

        if (error) {
          toast.error("Failed to delete email");
          return;
        }

        toast.success("Email removed successfully");
        refetch();
      } catch (error) {
        console.error("Failed to delete email:", error);
        toast.error("An error occurred while deleting the email");
      }
    },
    [refetch],
  );

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return <LoadingState variant="list" count={5} />;
  }

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          placeholder="Search emails..."
          value={searchQuery}
          onChange={handleSearchChange}
          containerClassName="max-w-md flex-1"
        />
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 size-4" />
          Add Email
        </Button>
      </div>

      {/* Mailing List */}
      <MailingList
        entries={filteredMailingList}
        onDelete={handleDeleteEmail}
        onAdd={handleOpenAddDialog}
      />

      {/* Dialogs */}
      <AddEmailDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        email={newEmail}
        onEmailChange={setNewEmail}
        onSubmit={handleAddEmail}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
