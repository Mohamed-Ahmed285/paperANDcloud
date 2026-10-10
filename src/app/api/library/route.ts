import { guard, ok } from "@/lib/http";
import { getLibrary } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  return guard(async () => ok(await getLibrary()));
}
