"use client";

import { Mail, Trash2, Plus } from "lucide-react";

import { Button } from "@midori/components/ui/button";
import { Card, CardHeader } from "@midori/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
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

// ============================================================================
// Types
// ============================================================================

export type MailingEntry = {
  id: number;
  email: string;
};

// ============================================================================
// Mailing Card
// ============================================================================

interface MailingCardProps {
  entry: MailingEntry;
  onDelete: (mailingId: number) => void;
}

export function MailingCard({ entry, onDelete }: MailingCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/50">
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
                  Are you sure you want to remove <strong>{entry.email}</strong>{" "}
                  from the mailing list? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(entry.id)}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
    </Card>
  );
}

// ============================================================================
// Mailing List
// ============================================================================

interface MailingListProps {
  entries: MailingEntry[];
  onDelete: (mailingId: number) => void;
  onAdd: () => void;
}

export function MailingList({ entries, onDelete, onAdd }: MailingListProps) {
  if (entries.length === 0) {
    return (
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
        <Button onClick={onAdd}>
          <Plus className="mr-2 size-4" />
          Add First Email
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <MailingCard key={entry.id} entry={entry} onDelete={onDelete} />
      ))}
    </div>
  );
}
