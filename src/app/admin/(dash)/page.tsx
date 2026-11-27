import Link from "next/link";
import { Badge, Card, PageTitle, Stat } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { nowIST } from "@/lib/reservations";
import { getStore } from "@/lib/store";

export default async function Overview() {
  await guard("staff");
  const store = getStore();
  const today = nowIST().date;
  const startUtc = new Date(`${today}T00:00:00+05:30`).toISOString();
  const [orders, reservations, products, messages, logs, settings] = await Promise.all([
    store.listOrders({ from: startUtc, limit: 500 }),
    store.listReservations({ from: today, limit: 500 }),
    store.listProducts({ includeUnavailable: true }),
    store.listContactMessages(5),
    store.listNotificationLogs(8),
    store.getSettings(),
  ]);
  const paid = orders.filter((o) => o.payment_status === "paid");
  const revenue = paid.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.total, 0);
  const pendingOrders = paid.filter((o) => o.status === "pending");
  const active = paid.filter((o) => ["confirmed", "preparing", "ready_for_pickup", "out_for_delivery"].includes(o.status));
  const completed = paid.filter((o) => o.status === "completed");
  const pendingRes = reservations.filter((r) => r.status === "requested");
  const unpriced = products.filter((p) => p.price == null).length;
  const unverified = products.filter((p) => p.verification !== "verified").length;

  const setup = [
    { done: unpriced === 0, label: `Add real prices (${unpriced} items have no price)`, href: "/admin/menu" },
    { done: unverified === 0, label: `Review item descriptions & veg marks (${unverified} unverified)`, href: "/admin/menu" },
    { done: settings.business.hours != null && settings.business.hours_verification === "verified", label: "Confirm opening hours", href: "/admin/settings" },
    { done: settings.commerce.tax_bps != null, label: "Set GST rate for online orders", href: "/admin/settings" },
    { done: settings.reservations.max_covers_per_slot != null, label: "Set seating capacity for reservations", href: "/admin/settings" },
    { done: settings.business.instagram_url != null, label: "Add the official Instagram link", href: "/admin/settings" },
    { done: settings.content.hero_image_url != null, label: "Upload a hero photograph", href: "/admin/content" },
    { done: settings.notifications.admin_emails.length > 0, label: "Add an email for order alerts", href: "/admin/settings" },
    { done: settings.commerce.ordering_enabled, label: "Turn on online ordering", href: "/admin/settings" },
  ];
  const todo = setup.filter((s) => !s.done);

  return (
    <>
      <PageTitle title="Today">
        <p className="rounded-full bg-paper px-4 py-2 text-sm text-muted ring-1 ring-ink/8">{new Date(`${today}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</p>
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Orders today" value={paid.length} tone="turquoise" />
        <Stat label="Revenue today" value={formatINR(revenue)} hint="Paid, not cancelled" tone="navy" />
        <Stat label="New orders" value={pendingOrders.length} hint="Awaiting acceptance" />
        <Stat label="Completed" value={completed.length} />
        <Stat label="Table requests" value={pendingRes.length} hint="Awaiting approval" tone="blush" />
      </div>

      {todo.length > 0 && (
        <Card title="Before going live" className="mt-6 border-l-4 border-l-pink">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {todo.map((t) => <li key={t.label}><Link href={t.href} className="group flex items-center gap-3 rounded-full px-2 py-1.5 transition-colors hover:bg-turquoise-soft"><span className="h-4 w-4 shrink-0 rounded-full border-2 border-turquoise-deep/50 group-hover:border-turquoise-deep" aria-hidden />{t.label}</Link></li>)}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Needs attention" action={<Link href="/admin/orders" className="link-underline text-xs font-semibold text-turquoise-deep">All orders</Link>}>
          {[...pendingOrders, ...active].length === 0 ? <p className="text-sm text-muted">No open orders.</p> : (
            <ul className="divide-y divide-oat text-sm">
              {[...pendingOrders, ...active].slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/orders?open=${o.id}`} className="font-semibold hover:underline">{o.reference}</Link>
                  <span className="truncate text-muted">{o.customer_name} · {o.fulfilment}</span>
                  <Badge value={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Table requests" action={<Link href="/admin/reservations" className="link-underline text-xs font-semibold text-turquoise-deep">All reservations</Link>}>
          {pendingRes.length === 0 ? <p className="text-sm text-muted">No pending requests.</p> : (
            <ul className="divide-y divide-oat text-sm">
              {pendingRes.slice(0, 8).map((r) => (
                <li key={r.id} className="flex justify-between gap-3 py-2.5"><span className="font-semibold">{r.name}</span><span className="text-muted">{r.date} · {r.time} · {r.guests} guests</span></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Messages">
          {messages.length === 0 ? <p className="text-sm text-muted">No messages yet.</p> : (
            <ul className="divide-y divide-oat text-sm">
              {messages.map((m) => (
                <li key={m.id} className="py-2.5"><p className="font-semibold">{m.name} <span className="font-normal text-muted">· {m.phone ?? m.email}</span></p><p className="mt-1 text-muted">{m.message}</p></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent notifications">
          {logs.length === 0 ? <p className="text-sm text-muted">Nothing sent yet.</p> : (
            <ul className="divide-y divide-oat text-xs">
              {logs.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-2"><span>{l.channel} · {l.template.replace(/_/g, " ")}</span><Badge value={l.status === "sent" ? "paid" : l.status === "failed" ? "failed" : "unpaid"} /></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
