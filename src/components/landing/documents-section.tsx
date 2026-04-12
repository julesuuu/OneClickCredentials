import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const documents = [
  { name: "Transcript of Records (TOR)" },
  { name: "Diploma" },
  { name: "Certificate of Good Moral Character" },
  { name: "Certificate of Enrollment" },
  { name: "Certificate of Grades" },
  { name: "Honorable Dismissal" },
];

export function DocumentsSection() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Documents
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Available Documents
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We offer a wide range of academic credentials to meet your needs
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {documents.map((doc, index) => (
            <Card
              key={index}
              className="bg-muted/50 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{doc.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
