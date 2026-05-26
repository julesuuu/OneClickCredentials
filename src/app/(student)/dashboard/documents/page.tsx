import { getDocumentTypes } from "./actions";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DocumentsPage() {
  const types = await getDocumentTypes();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Available Documents
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Browse the document types you can request
        </p>
      </div>

      {types.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No document types available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <Card key={type.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base">{type.name}</CardTitle>
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                {type.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="text-2xl font-bold text-primary">
                  ₱{type.price}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
