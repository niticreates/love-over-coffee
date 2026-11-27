import { IntegrationsManager } from "@/components/admin/IntegrationsManager";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function AdminIntegrations() {
  await guard("manager");
  const store = getStore();
  const [platforms, settings] = await Promise.all([store.listPlatforms(), store.getSettings()]);
  return (
    <>
      <PageTitle title="External Integrations & Booking Links" />
      <IntegrationsManager platforms={platforms} business={settings.business} />
    </>
  );
}
