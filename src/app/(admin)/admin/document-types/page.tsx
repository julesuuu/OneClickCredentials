import prisma from "@/lib/prisma";
import { DocumentTypesManager } from "./DocumentTypesManager";

export default async function DocumentTypesPage() {
  const documentTypes = await prisma.documentType.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <DocumentTypesManager documentTypes={documentTypes.map(d => ({ ...d, price: Number(d.price) }))} />;
}