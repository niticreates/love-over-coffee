import { OrdersTable } from "@/components/admin/OrdersTable";
import { PageTitle } from "@/components/admin/ui";
import { guard } from "@/lib/auth";
import { allowedNextStatuses } from "@/lib/services/orders";
import { getStore } from "@/lib/store";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; from?: string; to?: string; q?: string; open?: string }> }) {
  await guard("staff");
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const orders = await getStore().listOrders({
    status,
    from: sp.from ? new Date(`${sp.from}T00:00:00+05:30`).toISOString() : undefined,
    to: sp.to ? new Date(`${sp.to}T23:59:59+05:30`).toISOString() : undefined,
    q: sp.q?.slice(0, 40),
  });
  return (
    <>
      <PageTitle title="Orders" />
      <form className="mb-6 grid gap-3 admin-surface p-4 sm:grid-cols-5" method="get">
        <input name="q" defaultValue={sp.q} placeholder="Reference, name, phone" className="input sm:col-span-2" aria-label="Search orders" />
        <select name="status" defaultValue={status ?? ""} className="input" aria-label="Status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="input" aria-label="From date" />
        <div className="flex gap-2"><input type="date" name="to" defaultValue={sp.to} className="input" aria-label="To date" /><button className="btn btn-dark px-4">Filter</button></div>
      </form>
      <OrdersTable orders={orders.map((o) => ({ ...o, next: allowedNextStatuses(o) }))} openId={sp.open} />
    </>
  );
}
