import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Sheet } from "@/components/page-header";
import { Settings } from "@/components/settings";
import { ListSkeleton } from "@/components/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/server";

export const metadata: Metadata = { title: "Ajustes · Nossa Wishlist" };

export default function SettingsPage() {
  return (
    <main className="flex-1 flex flex-col">
      <PageHeader title="Ajustes" subtitle="Tema, avisos e coelhinhos." />
      <Sheet>
        <Suspense fallback={<ListSkeleton count={3} />}>
          <Loaded />
        </Suspense>
      </Sheet>
    </main>
  );
}

async function Loaded() {
  const user = await getCurrentUser();
  const { data } = await db().from("profiles").select("notify_new_items, notify_occasions").eq("id", user.id).single();
  return (
    <Settings notifyNewItems={data?.notify_new_items ?? true} notifyOccasions={data?.notify_occasions ?? true}
      vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} partnerName={user.partner?.displayName ?? ""} />
  );
}
