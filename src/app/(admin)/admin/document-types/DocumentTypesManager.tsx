"use client";

import * as React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType, toggleDocumentTypeActive } from "./actions";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, Loader2 } from "lucide-react";

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentTypesManagerProps {
  documentTypes: DocumentType[];
}

export function DocumentTypesManager({ documentTypes: initialData }: DocumentTypesManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<DocumentType | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    isActive: true,
  });

  const { data: documentTypes, isLoading } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: async () => {
      const data = await getDocumentTypes();
      return data.map((item): DocumentType => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    },
    initialData,
  });

  const createMutation = useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });
      setIsOpen(false);
      resetForm();
      toast.success("Document type created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });
      setEditingType(null);
      resetForm();
      toast.success("Document type updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });
      toast.success("Document type deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleDocumentTypeActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentTypes"] });
      toast.success("Status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", isActive: true });
  };

  const openEdit = (type: DocumentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || "",
      price: type.price.toString(),
      isActive: type.isActive,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("price", formData.price);
    form.append("isActive", formData.isActive.toString());

    if (editingType) {
      form.append("id", editingType.id);
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document type?")) {
      deleteMutation.mutate(id);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Types</h1>
          <p className="text-muted-foreground mt-1">Manage available document types for requests</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Document Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Document Type</DialogTitle>
              <DialogDescription>Create a new document type that students can request</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Transcript of Records"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₱)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {documentTypes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Document Types</h3>
            <p className="text-muted-foreground mt-2">Create your first document type to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.description || "-"}
                    </TableCell>
                    <TableCell>₱{type.price}</TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={type.isActive ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: type.id, isActive: !type.isActive })}
                          disabled={toggleMutation.isPending}
                        >
                          {type.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document Type</DialogTitle>
            <DialogDescription>Update the document type details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₱)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Active</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingType(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}