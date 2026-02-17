"use client";

import { useState } from "react";
import { 
  File, 
  Folder, 
  MoreVertical, 
  Download, 
  Trash2, 
  Upload, 
  Grid, 
  List as ListIcon,
  Search,
  Plus
} from "lucide-react";
import { 
  Card, 
  CardContent 
} from "@midori/components/ui/card";
import { 
  Button 
} from "@midori/components/ui/button";
import { 
  Input 
} from "@midori/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@midori/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midori/components/ui/table";
import { formatBytes } from "@midori/lib/format";

// Mock data to visualize the Drive-like UI
const MOCK_FILES = [
  { id: "1", name: "Lecture_Notes.pdf", type: "FILE", size: 2450000, updatedAt: "2024-03-20T10:00:00Z" },
  { id: "2", name: "Project_Assets", type: "FOLDER", size: 0, updatedAt: "2024-03-19T15:30:00Z" },
  { id: "3", name: "Final_Report.docx", type: "FILE", size: 1200000, updatedAt: "2024-03-18T09:15:00Z" },
  { id: "4", name: "Screenshots", type: "FOLDER", size: 0, updatedAt: "2024-03-17T21:45:00Z" },
  { id: "5", name: "Budget_2024.xlsx", type: "FILE", size: 850000, updatedAt: "2024-03-15T14:20:00Z" },
];

export function StorageClient() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = MOCK_FILES.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search in Drive..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="grid"><Grid className="size-4" /></TabsTrigger>
              <TabsTrigger value="list"><ListIcon className="size-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button className="flex-1 md:flex-none">
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
          <Button variant="secondary" className="flex-1 md:flex-none">
            <Plus className="mr-2 size-4" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Breadcrumbs Placeholder */}
      <div className="flex items-center text-sm text-muted-foreground gap-2">
        <span className="hover:text-foreground cursor-pointer">My Drive</span>
        <span>/</span>
        <span className="font-medium text-foreground">All Files</span>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-3 relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-8 w-8">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Download className="mr-2 size-4" /> Download</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 size-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {item.type === "FOLDER" ? (
                    <Folder className="size-12 text-blue-500 fill-blue-500/20" />
                  ) : (
                    <File className="size-12 text-muted-foreground" />
                  )}
                  
                  <div className="text-center w-full">
                    <p className="text-sm font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.type === "FOLDER" ? "Folder" : formatBytes(item.size)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {item.type === "FOLDER" ? (
                          <Folder className="size-4 text-blue-500" />
                        ) : (
                          <File className="size-4 text-muted-foreground" />
                        )}
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.type === "FOLDER" ? "--" : formatBytes(item.size)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Download className="mr-2 size-4" /> Download</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 size-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="size-12 mb-4 opacity-20" />
            <p>No files found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
