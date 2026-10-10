import { guard, ok, parseBody, readJson } from "@/lib/http";
import { ItemInputSchema } from "@/lib/schemas";
import { createItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  return guard(async () => {
    const input = parseBody(ItemInputSchema, await readJson(req));
    return ok({ item: await createItem(input) }, 201);
  });
}
