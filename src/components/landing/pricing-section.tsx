import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const pricing = [
  { name: "Transcript of Records (TOR)", price: 500 },
  { name: "Diploma", price: 300 },
  { name: "Good Moral Character", price: 100 },
  { name: "Certificate of Enrollment", price: 200 },
  { name: "Certificate of Grades", price: 150 },
  { name: "Honorable Dismissal", price: 250 },
];

export function PricingSection() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. Simple and transparent pricing for all documents
          </p>
        </div>
        <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-xl border-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground font-bold w-full p-5">
                  Document Type
                </TableHead>
                <TableHead className="text-primary-foreground font-bold text-right p-5">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium p-5">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold p-5">
                    ₱{item.price}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <p className="text-muted-foreground text-sm">
            * Additional stamp: ₱30 each
          </p>
          <Separator orientation="vertical" className="h-4" />
          <p className="text-muted-foreground text-sm">
            * Bulk discounts available
          </p>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="w-full py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get your documents in 4 simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            {
              step: 1,
              title: "Create Account",
              desc: "Sign up in seconds",
            },
            {
              step: 2,
              title: "Request Documents",
              desc: "Choose what you need",
            },
            { step: 3, title: "Make Payment", desc: "Pay online or cash" },
            { step: 4, title: "Pick Up", desc: "Schedule & collect" },
          ].map((item) => (
            <Card
              key={item.step}
              className="text-center relative shadow-lg"
            >
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {item.step}
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
