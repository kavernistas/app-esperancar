// src/api/notifications.js — Notifications API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { normalizeList } from "@/lib/normalizeList";

export async function listNotifications(params = {}) {
  try {
    const result = await base44.entities.Notification.list("-created_date", 50);
    return normalizeList(result);
  } catch (e) {
    console.error("[notificationsApi] list:", e);
    return [];
  }
}

export async function markAsRead(id) {
  return await base44.entities.Notification.update(id, { read: true });
}

export async function markAllRead() {
  try {
    const me = await base44.auth.me();
    if (!me?.id) return;
    await base44.entities.Notification.updateMany(
      { user_id: me.id, read: false },
      { $set: { read: true } }
    );
  } catch (e) {
    console.error("[notificationsApi] markAllRead:", e);
  }
}