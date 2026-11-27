import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { paymentMode } from "@/lib/config";
import { env } from "@/lib/config";
import { getStore } from "@/lib/store";

export default async function AdminSettings() {
  const admin = await guard("manager");
  const s = await getStore().getSettings();
  const integrations = {
    payments: paymentMode() === "razorpay" ? (env.razorpayKeyId.startsWith("rzp_test_") ? "Razorpay — test mode" : "Razorpay — live") : "Not configured (simulated in preview)",
    webhook: env.razorpayWebhookSecret ? "Configured" : "Not configured",
    email: env.resendKey && env.emailFrom ? "Resend configured" : "Not configured",
    whatsapp: env.whatsappToken && env.whatsappPhoneNumberId ? "WhatsApp Cloud API configured" : "Not configured",
  };
  return (
    <>
      <PageTitle title="Settings" />
      <SettingsEditor settings={s} isOwner={admin.role === "owner"} integrations={integrations} />
    </>
  );
}
