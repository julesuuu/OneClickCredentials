"use client";

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
import { getStudents } from "./actions";

export default function AdminStudentVerificationPage() {
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

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Student Verification
      </h1>
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
            {!students || students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No students have registered yet.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.fullName}
                  </TableCell>
                  <TableCell>{student.studentNumber}</TableCell>
                  <TableCell>{student.course}</TableCell>
                  <TableCell>{student.yearLevel}</TableCell>
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
