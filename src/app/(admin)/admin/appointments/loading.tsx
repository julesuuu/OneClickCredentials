import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAppointmentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
