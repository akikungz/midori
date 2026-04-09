"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { api, fetchClient, getApiErrorMessage } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import { LoadingState } from "@midori/components/shared/LoadingState";
import { SearchInput } from "@midori/components/shared/SearchInput";
import { MailingList, type MailingEntry } from "./mailing-list/MailingCard";
import { AddEmailDialog } from "./mailing-list/MailingDialogs";

const DEFAULT_MAILING_EMAIL_DOMAIN = "@itm.kmutnb.ac.th";

function normalizeMailingEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  if (!trimmed.includes("@")) {
    return `${trimmed}${DEFAULT_MAILING_EMAIL_DOMAIN}`;
  }

  const [localPart, domainPart] = trimmed.split("@");

  if (!localPart) {
    return "";
  }

  if (!domainPart) {
    return `${localPart}${DEFAULT_MAILING_EMAIL_DOMAIN}`;
  }

  return trimmed;
}

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
    const normalizedEmail = normalizeMailingEmail(newEmail);

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setNewEmail(normalizedEmail);

    setIsSubmitting(true);
    const result = await fetchClient
      .POST("/api/academic/mailing-list", {
        body: { email: normalizedEmail },
      })
      .catch((error) => {
        console.error("Failed to add email:", error);
        toast.error(
          getApiErrorMessage(error) ??
            "An error occurred while adding the email",
        );
        return null;
      });

    setIsSubmitting(false);

    if (!result) {
      return;
    }

    const resultError = (result as { error?: unknown }).error;
    if (resultError) {
      toast.error(getApiErrorMessage(resultError) ?? "Failed to add email");
      return;
    }

    toast.success("Email added successfully");
    setNewEmail("");
    setIsAddDialogOpen(false);
    refetch();
  }, [newEmail, refetch]);

  const handleDeleteEmail = useCallback(
    async (mailingId: number) => {
      const result = await fetchClient
        .DELETE("/api/academic/mailing-list/{mailingId}", {
          params: { path: { mailingId } },
        })
        .catch((error) => {
          console.error("Failed to delete email:", error);
          toast.error(
            getApiErrorMessage(error) ??
              "An error occurred while deleting the email",
          );
          return null;
        });

      if (!result) {
        return;
      }

      const resultError = (result as { error?: unknown }).error;
      if (resultError) {
        toast.error(
          getApiErrorMessage(resultError) ?? "Failed to delete email",
        );
        return;
      }

      toast.success("Email removed successfully");
      refetch();
    },
    [refetch],
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          placeholder="Search emails..."
          value={searchQuery}
          onChange={handleSearchChange}
          containerClassName="max-w-md flex-1"
          disabled={false}
          showClear={!isLoading}
        />
        <Button onClick={handleOpenAddDialog} disabled={isLoading}>
          <Plus className="mr-2 size-4" />
          Add Email
        </Button>
      </div>

      {/* Mailing List */}
      {isLoading ? (
        <LoadingState variant="list" count={5} />
      ) : (
        <MailingList
          entries={filteredMailingList}
          onDelete={handleDeleteEmail}
          onAdd={handleOpenAddDialog}
        />
      )}

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
