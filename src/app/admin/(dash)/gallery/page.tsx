import { GalleryManager } from "@/components/admin/GalleryManager";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function AdminGallery() {
  await guard("manager");
  return (
    <>
      <PageTitle title="Gallery" />
      <GalleryManager images={await getStore().listGallery()} />
    </>
  );
}
