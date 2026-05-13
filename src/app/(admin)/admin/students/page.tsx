"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStudents, verifyStudent } from "./actions";
import { Search, Eye, Check, X, RefreshCw } from "lucide-react";
import { formatEnumValue } from "@/lib/utils";

export default function AdminStudentVerificationPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const [selectedUpload, setSelectedUpload] = useState<{
    url: string;
    fileType: string;
  } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    fullName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      studentId,
      isVerified,
      declineReason,
    }: {
      studentId: string;
      isVerified: boolean;
      declineReason?: string;
    }) => verifyStudent(studentId, isVerified, declineReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSelectedStudent(null);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Student Verification
        </h1>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
          Loading students...
        </div>
      </div>
    );
  }

  const filterButtons = [
    { value: "all" as const, label: "All" },
    { value: "pending" as const, label: "Pending" },
    { value: "verified" as const, label: "Verified" },
  ];

  const filteredStudents = !students
    ? []
    : students
        .filter((s) => {
          if (filter === "verified") return s.isVerified;
          if (filter === "pending") return !s.isVerified;
          return true;
        })
        .filter((s) => {
          if (!search) return true;
          const searchLower = search.toLowerCase();
          return (
            s.fullName.toLowerCase().includes(searchLower) ||
            s.studentNumber.toLowerCase().includes(searchLower) ||
            s.user.email.toLowerCase().includes(searchLower)
          );
        });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Student Verification
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, student number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {filterButtons.map(({ value, label }) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
              size="sm"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Student Number</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Year Level</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Verification Status</TableHead>
              <TableHead>Profile Status</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredStudents || filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const proofOfEnrollment = student.uploads[0];
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.fullName}
                    </TableCell>
                    <TableCell>{student.studentNumber}</TableCell>
                    <TableCell>{student.course}</TableCell>
                    <TableCell>{formatEnumValue(student.yearLevel)}</TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>
                      {student.isVerified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : student.declineReason ? (
                        <Badge variant="destructive">Rejected</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.isProfileComplete ? "default" : "outline"
                        }
                      >
                        {student.isProfileComplete ? "Complete" : "Incomplete"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proofOfEnrollment ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSelectedUpload({
                              url: proofOfEnrollment.url,
                              fileType: proofOfEnrollment.fileType,
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.isVerified ? (
                        <span className="text-muted-foreground text-sm">
                          Verified
                        </span>
                      ) : student.declineReason ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            verifyMutation.mutate({
                              studentId: student.id,
                              isVerified: true,
                            })
                          }
                          disabled={verifyMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              verifyMutation.mutate({
                                studentId: student.id,
                                isVerified: true,
                              })
                            }
                            disabled={verifyMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setSelectedStudent({
                                id: student.id,
                                fullName: student.fullName,
                              })
                            }
                            disabled={verifyMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedUpload}
        onOpenChange={() => setSelectedUpload(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Proof of Enrollment</DialogTitle>
            <DialogDescription>
              Document preview for student verification
            </DialogDescription>
          </DialogHeader>
          {selectedUpload &&
            (selectedUpload.fileType.startsWith("image/") ? (
              <img
                src={selectedUpload.url}
                alt="Proof of Enrollment"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            ) : (
              <iframe
                src={selectedUpload.url}
                className="w-full h-[500px]"
                title="Proof of Enrollment"
              />
            ))}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => {
          setSelectedStudent(null);
          setRejectReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Student</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedStudent?.fullName}.
              This will be shown to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStudent(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedStudent && rejectReason.trim()) {
                  verifyMutation.mutate({
                    studentId: selectedStudent.id,
                    isVerified: false,
                    declineReason: rejectReason.trim(),
                  });
                }
              }}
              disabled={verifyMutation.isPending || !rejectReason.trim()}
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
