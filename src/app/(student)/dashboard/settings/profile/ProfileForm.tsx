"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateProfile } from "./actions";
import { updateProfileImage } from "../actions";
import { UploadButton } from "@/utils/uploadthing";
import { course, yearLevel, gender } from "../../onboarding/data";
import {
  User,
  GraduationCap,
  FileText,
  ShieldCheck,
} from "lucide-react";

interface ProfileFormProps {
  initialData: {
    fullName: string;
    gender: string;
    birthDate: string;
    phoneNumber: string;
    lrn: string;
    studentNumber: string;
    course: string;
    yearLevel: string;
    isVerified: boolean;
    declineReason: string | null;
    email: string;
    name: string | null;
    image: string | null;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: initialData.fullName,
    phoneNumber: initialData.phoneNumber,
    gender: initialData.gender,
    birthDate: initialData.birthDate,
    course: initialData.course,
    yearLevel: initialData.yearLevel,
  });
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialData.image);

  const initials = (initialData.name ?? initialData.fullName)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasChanges =
    formData.fullName !== initialData.fullName ||
    formData.phoneNumber !== initialData.phoneNumber ||
    formData.gender !== initialData.gender ||
    formData.birthDate !== initialData.birthDate ||
    formData.course !== initialData.course ||
    formData.yearLevel !== initialData.yearLevel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateProfile({
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      gender: formData.gender,
      birthDate: formData.birthDate,
      course: formData.course,
      yearLevel: formData.yearLevel,
    });

    if (result.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error ?? "Failed to update profile");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 group">
              <div className="size-16 rounded-full overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={initialData.name ?? "Avatar"}
                    width={64}
                    height={64}
                    className="size-16 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-xs text-white font-medium">Change</span>
              </div>
              <UploadButton
                endpoint="profileImage"
                input={{}}
                onClientUploadComplete={async (res) => {
                  if (res?.[0]?.ufsUrl) {
                    const url = res[0].ufsUrl;
                    const result = await updateProfileImage(url);
                    if (result.success) {
                      setImageUrl(url);
                      router.refresh();
                    }
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error("Failed to upload image");
                  console.error("Upload error:", error);
                }}
                className="absolute inset-0 z-10 ut-button:bg-transparent ut-button:text-transparent ut-button:border-none ut-button:shadow-none ut-button:w-full ut-button:h-full ut-button:absolute ut-button:inset-0 ut-button:cursor-pointer ut-button:rounded-full ut-allowed-content:hidden"
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg truncate">
                {initialData.fullName}
              </p>
              <p className="text-sm text-muted-foreground">
                {initialData.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant={initialData.isVerified ? "default" : "secondary"}
                  className="gap-1"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {initialData.isVerified ? "Verified" : "Unverified"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {initialData.studentNumber}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="09123456789"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Date</label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select
                value={formData.gender}
                onValueChange={(v) =>
                  setFormData({ ...formData, gender: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gender.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select
                value={formData.course}
                onValueChange={(v) =>
                  setFormData({ ...formData, course: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {course.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year Level</label>
              <Select
                value={formData.yearLevel}
                onValueChange={(v) =>
                  setFormData({ ...formData, yearLevel: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearLevel.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read-only Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Other Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                LRN (Learner Reference Number)
              </label>
              <Input value={initialData.lrn} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Student Number
              </label>
              <Input value={initialData.studentNumber} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setFormData({
              fullName: initialData.fullName,
              phoneNumber: initialData.phoneNumber,
              gender: initialData.gender,
              birthDate: initialData.birthDate,
              course: initialData.course,
              yearLevel: initialData.yearLevel,
            })
          }
          disabled={!hasChanges || saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <span className="animate-spin mr-1.5 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
