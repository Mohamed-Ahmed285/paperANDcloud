import { guard, ok, parseBody, parseId, readJson } from "@/lib/http";
import { FavoritePatchSchema, ItemInputSchema } from "@/lib/schemas";
import { deleteItem, setFavorite, updateItem } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Body `{ isFavorite }` toggles the favorite; a full item body replaces the item's content. */
export function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const id = parseId((await params).id);
    const body = await readJson(req);
    const fav = FavoritePatchSchema.safeParse(body);
    if (fav.success) return ok({ item: await setFavorite(id, fav.data.isFavorite) });
    return ok({ item: await updateItem(id, parseBody(ItemInputSchema, body)) });
  });
}

export function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const id = parseId((await params).id);
    await deleteItem(id);
    return ok({ id });
  });
}
