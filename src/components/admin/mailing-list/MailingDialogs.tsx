"use client";

import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";

// ============================================================================
// Add Email Dialog
// ============================================================================

interface AddEmailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AddEmailDialog({
  isOpen,
  onOpenChange,
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
}: AddEmailDialogProps) {
  const trimmedEmail = email.trim();
  const isValidEmail = trimmedEmail.length > 0 && !trimmedEmail.startsWith("@");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tip: if you enter only username, we&apos;ll auto-append
              @itm.kmutnb.ac.th.
            </p>
          </Field>
          <Button
            className="w-full"
            disabled={!isValidEmail || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Adding..." : "Add Email"}
          </Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
