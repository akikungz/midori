"use client";

import { useState } from "react";
import { Key, Plus, Trash2, User, Shield, Clock } from "lucide-react";

import { api } from "@midori/lib/api";
import { useSession } from "@midori/hooks/useSession";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@midori/components/ui/tabs";
import { getRoleDisplayName, getRoleBadgeVariant } from "@midori/lib/roles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midori/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { Textarea } from "@midori/components/ui/textarea";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";

export default function SettingsPage() {
  const { user, role, isLoading: userLoading } = useSession();
  const [sshKeyName, setSshKeyName] = useState("");
  const [sshPublicKey, setSshPublicKey] = useState("");

  const { data: sshKeysData, isLoading: keysLoading } = api.useQuery(
    "get",
    "/api/user/ssh-keys",
    {
      params: {
        query: { page: 1, pageSize: 50 },
      },
    },
  );

  const sshKeys = sshKeysData?.values || [];

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and SSH keys
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-1.5 size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="ssh-keys">
            <Key className="mr-1.5 size-4" />
            SSH Keys
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Shield className="mr-1.5 size-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Your basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{user?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  {role && (
                    <Badge variant={getRoleBadgeVariant(role)} className="mt-1">
                      {getRoleDisplayName(role)}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{user?.id || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SSH Keys Tab */}
        <TabsContent value="ssh-keys" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">SSH Keys</CardTitle>
                <CardDescription>
                  Manage your SSH public keys for secure access
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 size-4" />
                    Add Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add SSH Key</DialogTitle>
                    <DialogDescription>
                      Add a new SSH public key to your account
                    </DialogDescription>
                  </DialogHeader>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="key-name">Key Name</FieldLabel>
                      <Input
                        id="key-name"
                        placeholder="My Laptop"
                        value={sshKeyName}
                        onChange={(e) => setSshKeyName(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="public-key">Public Key</FieldLabel>
                      <Textarea
                        id="public-key"
                        placeholder="ssh-rsa AAAAB3NzaC1yc2E..."
                        className="font-mono text-sm"
                        rows={4}
                        value={sshPublicKey}
                        onChange={(e) => setSshPublicKey(e.target.value)}
                      />
                    </Field>
                    <Button className="w-full">Add SSH Key</Button>
                  </FieldGroup>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {keysLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : sshKeys.length === 0 ? (
                <Empty>
                  <EmptyMedia variant="icon">
                    <Key />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No SSH Keys</EmptyTitle>
                    <EmptyDescription>
                      Add an SSH key to connect to your instances securely.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {sshKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Key className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium">{key.name}</p>
                          <p className="truncate text-sm font-mono text-muted-foreground">
                            {key.publicKey.slice(0, 50)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      This browser session
                    </p>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
