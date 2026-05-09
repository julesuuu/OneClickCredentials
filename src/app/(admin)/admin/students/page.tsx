"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { getStudents } from "./actions";
import { Search } from "lucide-react";
import { formatEnumValue } from "@/lib/utils";

export default function AdminStudentVerificationPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
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
              <TableHead>Registered On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredStudents || filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.fullName}
                  </TableCell>
                  <TableCell>{student.studentNumber}</TableCell>
                  <TableCell>{student.course}</TableCell>
                  <TableCell>{formatEnumValue(student.yearLevel)}</TableCell>
                  <TableCell>{student.user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={student.isVerified ? "default" : "secondary"}
                    >
                      {student.isVerified ? "Verified" : "Pending"}
                    </Badge>
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
                    {student.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
