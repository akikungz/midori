"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Server, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { toast } from "sonner";

import { fetchClient } from "@midori/lib/api";
import { useAutocomplete } from "@midori/hooks/useAutocomplete";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Textarea } from "@midori/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Autocomplete } from "@midori/components/ui/autocomplete";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@midori/components/ui/field";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import { Slider } from "@midori/components/ui/slider";

export function NewRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseOfferingId, setSelectedCourseOfferingId] = useState<
    number | null
  >(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [cpus, setCpus] = useState(2);
  const [memoryGB, setMemoryGB] = useState(4);
  const [diskGB, setDiskGB] = useState(16);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use autocomplete hook for course offerings
  const courseOfferingsAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/course-offerings",
    limit: 20,
  });

  // Use autocomplete hook for templates
  const templatesAutocomplete = useAutocomplete({
    endpoint: "/api/autocomplete/templates",
    limit: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCourseOfferingId ||
      !selectedTemplateId ||
      !title ||
      !description
    )
      return;

    setIsSubmitting(true);
    try {
      const { error } = await fetchClient.POST("/api/requests/", {
        body: {
          title,
          description,
          courseOfferingId: selectedCourseOfferingId,
          cpus,
          memoryMB: memoryGB * 1024,
          diskGB,
          pveTemplateId: selectedTemplateId,
        },
      });

      if (error) {
        toast.error("Failed to create request");
        return;
      }

      toast.success("Request created successfully");
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Failed to create request:", error);
      toast.error("Failed to create request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show empty state only when autocomplete returns empty results and not loading
  if (
    !courseOfferingsAutocomplete.isLoading &&
    courseOfferingsAutocomplete.options.length === 0 &&
    courseOfferingsAutocomplete.search === ""
  ) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Server />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No Courses Available</EmptyTitle>
          <EmptyDescription>
            There are no active courses available for enrollment. Please contact
            your administrator.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Information</CardTitle>
              <CardDescription>
                Basic information about your instance request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <FieldDescription>
                    A short title for your request
                  </FieldDescription>
                  <Input
                    id="title"
                    placeholder="My Development VM"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="course">Course</FieldLabel>
                  <FieldDescription>
                    Select the course this instance is for
                  </FieldDescription>
                  <Autocomplete
                    placeholder="Select a course..."
                    searchPlaceholder="Search courses..."
                    search={courseOfferingsAutocomplete.search}
                    onSearchChange={courseOfferingsAutocomplete.setSearch}
                    options={courseOfferingsAutocomplete.options}
                    isLoading={courseOfferingsAutocomplete.isLoading}
                    value={selectedCourseOfferingId}
                    onChange={setSelectedCourseOfferingId}
                    emptyMessage="No courses found."
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="template">Operating System</FieldLabel>
                  <FieldDescription>
                    Select the operating system template
                  </FieldDescription>
                  <Autocomplete
                    placeholder="Select an OS template..."
                    searchPlaceholder="Search templates..."
                    search={templatesAutocomplete.search}
                    onSearchChange={templatesAutocomplete.setSearch}
                    options={templatesAutocomplete.options}
                    isLoading={templatesAutocomplete.isLoading}
                    value={selectedTemplateId}
                    onChange={setSelectedTemplateId}
                    emptyMessage="No templates found."
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <FieldDescription>
                    Explain what you'll use this instance for
                  </FieldDescription>
                  <Textarea
                    id="description"
                    placeholder="I need this instance to work on my course project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Instance Specifications
              </CardTitle>
              <CardDescription>
                Configure the resources for your virtual machine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-muted-foreground" />
                      <FieldLabel>CPU Cores</FieldLabel>
                    </div>
                    <span className="font-semibold">{cpus} vCPU</span>
                  </div>
                  <Slider
                    value={[cpus]}
                    onValueChange={(values: number[]) => setCpus(values[0])}
                    min={1}
                    max={8}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 vCPU</span>
                    <span>8 vCPUs</span>
                  </div>
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="size-4 text-muted-foreground" />
                      <FieldLabel>Memory</FieldLabel>
                    </div>
                    <span className="font-semibold">{memoryGB} GB</span>
                  </div>
                  <Slider
                    value={[memoryGB]}
                    onValueChange={(values: number[]) => setMemoryGB(values[0])}
                    min={1}
                    max={16}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 GB</span>
                    <span>16 GB</span>
                  </div>
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="size-4 text-muted-foreground" />
                      <FieldLabel>Disk Size</FieldLabel>
                    </div>
                    <span className="font-semibold">{diskGB} GB</span>
                  </div>
                  <Slider
                    value={[diskGB]}
                    onValueChange={(values: number[]) => setDiskGB(values[0])}
                    min={16}
                    max={64}
                    step={4}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>16 GB</span>
                    <span>64 GB</span>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPU</span>
                  <span className="font-medium">{cpus} vCPU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium">{memoryGB} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disk</span>
                  <span className="font-medium">{diskGB} GB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={
                !title ||
                !selectedCourseOfferingId ||
                !selectedTemplateId ||
                !description ||
                isSubmitting
              }
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
