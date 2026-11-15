import { Suspense } from "react";
import { Bunnies } from "@/components/bunnies";
import { ConfirmProvider } from "@/components/confirm";
import { NavLinks } from "@/components/nav-links";
import { getCurrentUser } from "@/lib/auth/current-user";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ConfirmProvider>
    <div className="flex-1 flex flex-col lg:flex-row min-h-dvh">
      <Suspense fallback={<div className="hidden lg:block w-[250px] shrink-0" />}>
        <Nav />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col pb-[84px] lg:pb-0">{children}</div>
      <Bunnies />
    </div>
    </ConfirmProvider>
  );
}

async function Nav() {
  const user = await getCurrentUser();
  return <NavLinks me={{ id: user.id, displayName: user.displayName, avatar: user.avatar }} partner={user.partner} />;
}
