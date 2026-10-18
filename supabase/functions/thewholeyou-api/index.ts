// The Whole You, the one door. Child-directed game: no accounts, no personal data.
// Routes: GET /health, GET /pulse, POST /complete {chapter, stars}, POST /night/run (cron, no work yet)
import { createClient } from "npm:@supabase/supabase-js@2";

const SLUG = "thewholeyou";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-thewholeyou-cron",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", ...CORS } });

const cache = new Map<string, { v: string | null; t: number }>();
async function cfg(key: string): Promise<string | null> {
  const c = cache.get(key);
  if (c && Date.now() - c.t < 60_000) return c.v;
  const { data, error } = await db.from("zo_config").select("value").eq("key", key).maybeSingle();
  if (error) return null; // fail closed: an unreadable brake refuses
  const v = data?.value ?? null;
  cache.set(key, { v, t: Date.now() });
  return v;
}
async function paused(): Promise<boolean> {
  const v = await cfg("THEWHOLEYOU_PAUSE");
  return v === null ? true : v === "true";
}
async function budgetLeft(): Promise<{ ok: boolean; spent: number; cap: number }> {
  const capRaw = await cfg("THEWHOLEYOU_DAILY_BUDGET_USD");
  const cap = capRaw === null ? 0 : Number(capRaw);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data, error } = await db.from("zo_cost_logs").select("cost_usd").eq("product_slug", SLUG).gte("created_at", since);
  if (error) return { ok: false, spent: 0, cap };
  const spent = (data ?? []).reduce((a: number, r: { cost_usd: number }) => a + Number(r.cost_usd || 0), 0);
  return { ok: spent < cap, spent, cap };
}

// Rate limit per isolate: at most 30 completions per minute per source ip hash bucket (no ip is stored)
const bucket = new Map<string, { n: number; t: number }>();
function allow(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const k = ip.slice(0, 12);
  const b = bucket.get(k);
  const now = Date.now();
  if (!b || now - b.t > 60_000) { bucket.set(k, { n: 1, t: now }); return true; }
  b.n++;
  return b.n <= 30;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const u = new URL(req.url);
  const path = u.pathname.replace(/^\/thewholeyou-api/, "") || "/";

  if (path === "/health") {
    const p = await paused();
    const b = await budgetLeft();
    return json({ ok: true, product: SLUG, paused: p, spent_24h_usd: b.spent, daily_cap_usd: b.cap, model_calls: "none", accounts: "none", personal_data: "none" });
  }
  if (path === "/pulse") {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { count, error } = await db.from("thewholeyou_completions").select("*", { count: "exact", head: true }).gte("created_at", since).lt("chapter", 90); // chapters >= 90 are drill rows
    if (error) return json({ ok: false, error: "ledger unreadable" }, 503);
    return json({ ok: true, product: SLUG, completions_7d: count ?? 0 });
  }
  if (path === "/complete" && req.method === "POST") {
    if (await paused()) return json({ ok: false, paused: true }, 503);
    if (!allow(req)) return json({ ok: false, error: "slow down: 30 per minute per source" }, 429);
    // global flood guard, read from the ledger itself (no identifiers): 300 completions per minute across all players
    const minuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recent, error: cErr } = await db.from("thewholeyou_completions").select("*", { count: "exact", head: true }).gte("created_at", minuteAgo);
    if (cErr) return json({ ok: false, error: "ledger unreadable" }, 503); // fail closed
    if ((recent ?? 0) >= 300) return json({ ok: false, error: "slow down: 300 per minute for everyone" }, 429);
    let body: { chapter?: unknown; stars?: unknown } = {};
    try { body = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
    const chapter = Number(body.chapter), stars = Number(body.stars ?? 0);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 99) return json({ ok: false, error: "bad chapter" }, 400);
    if (!Number.isInteger(stars) || stars < 0 || stars > 3) return json({ ok: false, error: "bad stars" }, 400);
    const { error } = await db.from("thewholeyou_completions").insert({ chapter, stars });
    if (error) return json({ ok: false, error: "write failed" }, 500);
    return json({ ok: true }, 201);
  }
  if (path === "/night/run" && req.method === "POST") {
    const secret = await cfg("THEWHOLEYOU_CRON_SECRET");
    if (!secret || req.headers.get("x-thewholeyou-cron") !== secret) return json({ ok: false }, 401);
    if (await paused()) return json({ ok: true, skipped: "paused" });
    return json({ ok: true, skipped: "nothing scheduled for this product" });
  }
  return json({ ok: false, error: "not found" }, 404);
});
