import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireProfileId } from "@/lib/auth/current-user";
import { scrapeMany } from "@/lib/scrape/scrape";

export const maxDuration = 60;

const body = z.object({ urls: z.array(z.string().url().max(2000)).min(1).max(10) });

// POST /api/scrape { urls: [...] } → um resultado por link, na mesma ordem.
export async function POST(request: NextRequest) {
  try {
    await requireProfileId();
  } catch {
    return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  }
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Envie de 1 a 10 links válidos." }, { status: 400 });
  const results = await scrapeMany(parsed.data.urls);
  return NextResponse.json({ results });
}
