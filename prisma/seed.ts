import prisma from "../src/lib/prisma";
import { hash } from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const courses = ["BSIT", "BSHM", "BSBA", "BSED", "BSCRIM"];
const yearLevels = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
];
const genders = ["MALE", "FEMALE"];
const verificationStatuses = [true, false];

const sampleStudents = [
  {
    name: "Juan Dela Cruz",
    email: "juan.delacruz@student.edu",
    lrn: "123456789012",
    studentNumber: "2023-00001",
    course: "BSIT",
    yearLevel: "THIRD_YEAR",
    isVerified: true,
  },
  {
    name: "Maria Santos",
    email: "maria.santos@student.edu",
    lrn: "234567890123",
    studentNumber: "2023-00002",
    course: "BSHM",
    yearLevel: "SECOND_YEAR",
    isVerified: false,
  },
  {
    name: "John Reyes",
    email: "john.reyes@student.edu",
    lrn: "345678901234",
    studentNumber: "2022-00001",
    course: "BSBA",
    yearLevel: "FOURTH_YEAR",
    isVerified: true,
  },
  {
    name: "Ana Garcia",
    email: "ana.garcia@student.edu",
    lrn: "456789012345",
    studentNumber: "2024-00001",
    course: "BSED",
    yearLevel: "FIRST_YEAR",
    isVerified: false,
  },
  {
    name: "Miguel Torres",
    email: "miguel.torres@student.edu",
    lrn: "567890123456",
    studentNumber: "2023-00003",
    course: "BSCRIM",
    yearLevel: "THIRD_YEAR",
    isVerified: false,
  },
  {
    name: "Sofia Mendoza",
    email: "sofia.mendoza@student.edu",
    lrn: "678901234567",
    studentNumber: "2022-00002",
    course: "BSIT",
    yearLevel: "FOURTH_YEAR",
    isVerified: true,
  },
  {
    name: "Pedro Villanueva",
    email: "pedro.villanueva@student.edu",
    lrn: "789012345678",
    studentNumber: "2024-00002",
    course: "BSHM",
    yearLevel: "FIRST_YEAR",
    isVerified: false,
  },
  {
    name: "Isabella Cruz",
    email: "isabella.cruz@student.edu",
    lrn: "890123456789",
    studentNumber: "2023-00004",
    course: "BSBA",
    yearLevel: "SECOND_YEAR",
    isVerified: true,
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  for (const student of sampleStudents) {
    const hashedPassword = await hash("password123", 10);

    const user = await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: student.name,
        email: student.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: student.name,
        lrn: student.lrn,
        studentNumber: student.studentNumber,
        course: student.course,
        yearLevel: student.yearLevel,
        isVerified: student.isVerified,
        isProfileComplete: true,
      },
      create: {
        userId: user.id,
        fullName: student.name,
        gender: genders[Math.floor(Math.random() * genders.length)],
        birthDate: new Date("2000-01-01"),
        phoneNumber: "09123456789",
        lrn: student.lrn,
        studentNumber: student.studentNumber,
        course: student.course,
        yearLevel: student.yearLevel,
        isVerified: student.isVerified,
        isProfileComplete: true,
      },
    });

    console.log(`✅ Created/updated: ${student.name}`);
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
