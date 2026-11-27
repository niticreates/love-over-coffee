import { ContentEditor } from "@/components/admin/ContentEditor";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function AdminContent() {
  await guard("manager");
  const s = await getStore().getSettings();
  return (
    <>
      <PageTitle title="Website content" />
      <ContentEditor content={s.content} />
    </>
  );
}
