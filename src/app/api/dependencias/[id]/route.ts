import { NextRequest } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";

const h = simpleCatalogHandlers("dependencias");

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return h.update(req, params.id);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return h.remove(params.id);
}
