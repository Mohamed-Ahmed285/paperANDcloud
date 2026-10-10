import { guard, ok, parseBody, parseId, readJson } from "@/lib/http";
import { CollectionInputSchema } from "@/lib/schemas";
import { deleteCollection, renameCollection } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const id = parseId((await params).id);
    const input = parseBody(CollectionInputSchema, await readJson(req));
    return ok({ collection: await renameCollection(id, input) });
  });
}

export function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const id = parseId((await params).id);
    await deleteCollection(id);
    return ok({ id });
  });
}
