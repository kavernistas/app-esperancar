// Shared helpers for Base44 entity API modules
import { normalizeList } from "@/lib/normalizeList";

const SORT_MAP = {
  created_at: "created_date",
  updated_at: "updated_date",
};

/** Map old NestJS sort fields to Base44 built-in fields */
export function mapSort(sort) {
  if (!sort) return "-created_date";
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  const mapped = SORT_MAP[field] || field;
  return desc ? `-${mapped}` : mapped;
}

/** Extract sort and limit from params object or separate sort argument */
export function extractOpts(params = {}, sortArg, defaultLimit = 500) {
  const sort = mapSort(sortArg || params.sort);
  const limit = params.limit || defaultLimit;
  return { sort, limit };
}

/** Build a Base44 filter object from API params, stripping non-entity fields */
export function buildFilter(params = {}) {
  const { sort, limit, page, search, is_leader, status, ...rest } = params;
  const filter = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null || value === "") continue;
    filter[key] = value;
  }
  // Only pass is_leader if it's a real boolean (not "yes"/"no" strings)
  if (typeof is_leader === "boolean") filter.is_leader = is_leader;
  // Normalize status to lowercase to match Base44 enum values
  if (status && typeof status === "string") filter.status = status.toLowerCase();
  return filter;
}

/** Safe list: returns normalized array, never throws */
export async function safeList(promise) {
  try {
    const result = await promise;
    return normalizeList(result);
  } catch (e) {
    console.error("[base44Api] list error:", e);
    return [];
  }
}