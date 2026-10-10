import { guard, ok, parseBody, readJson } from "@/lib/http";
import { CollectionInputSchema } from "@/lib/schemas";
import { createCollection } from "@/lib/store";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  return guard(async () => {
    const input = parseBody(CollectionInputSchema, await readJson(req));
    return ok({ collection: await createCollection(input) }, 201);
  });
}
