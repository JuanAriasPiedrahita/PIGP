import { NextRequest } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";

const h = simpleCatalogHandlers("dependencias");

export async function GET() {
  return h.list();
}

export async function POST(req: NextRequest) {
  return h.create(req);
}
