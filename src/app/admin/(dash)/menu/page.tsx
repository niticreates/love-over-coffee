import { MenuManager } from "@/components/admin/MenuManager";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { hasRole } from "@/lib/session";
import { getStore } from "@/lib/store";

export default async function AdminMenu() {
  const admin = await guard("staff");
  const store = getStore();
  const [categories, products] = await Promise.all([store.listCategories({ includeInactive: true }), store.listProducts({ includeUnavailable: true })]);
  return (
    <>
      <PageTitle title="Menu" />
      <MenuManager categories={categories} products={products} canEdit={hasRole(admin.role, "manager")} />
    </>
  );
}
