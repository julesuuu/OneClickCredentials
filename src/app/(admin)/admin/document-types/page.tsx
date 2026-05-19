import prisma from "@/lib/prisma";
import { DocumentTypesManager } from "./DocumentTypesManager";

export default async function DocumentTypesPage() {
  const documentTypes = await prisma.documentType.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <DocumentTypesManager
      documentTypes={documentTypes.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        price: d.price,
        isActive: d.isActive,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))}
    />
  );
}