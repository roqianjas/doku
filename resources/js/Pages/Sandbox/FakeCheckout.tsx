import StatusPill from '@/Components/StatusPill';
import AppShell from '@/Layouts/AppShell';
import { formatCurrency } from '@/lib/format';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';

type FakeCheckoutProps = PageProps<{
    order: {
        orderNumber: string;
        customerName: string;
        customerEmail: string;
        amount: number;
        currency: string;
        status: string;
        lineItems: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
        }>;
    };
    payment: {
        id: number;
        status: string;
        providerReference: string | null;
        requestId: string | null;
    };
}>;

const outcomes = [
    {
        status: 'paid',
        label: 'Mark as paid',
        tone: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
        status: 'pending',
        label: 'Keep pending',
        tone: 'bg-amber-500 hover:bg-amber-600',
    },
    {
        status: 'failed',
        label: 'Mark as failed',
        tone: 'bg-rose-600 hover:bg-rose-700',
    },
    {
        status: 'expired',
        label: 'Mark as expired',
        tone: 'bg-zinc-700 hover:bg-zinc-800',
    },
    {
        status: 'cancelled',
        label: 'Mark as cancelled',
        tone: 'bg-stone-900 hover:bg-black',
    },
] as const;

export default function FakeCheckout({ order, payment }: FakeCheckoutProps) {
    const submit = (status: (typeof outcomes)[number]['status']) => {
        router.post(route('sandbox.doku.checkout.update', order.orderNumber), {
            status,
        });
    };

    return (
        <AppShell>
            <Head title={`Fake Checkout ${order.orderNumber}`} />

            <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[34px] border border-stone-900/10 bg-stone-950 p-6 text-white shadow-[0_24px_80px_rgba(28,25,23,0.28)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-200">
                        Fake DOKU Checkout
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold">
                        Simulasikan hasil pembayaran lokal.
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-stone-300">
                        Halaman ini dipakai saat `DOKU_DRIVER=fake`. Tujuannya
                        agar app host, package, event log, dan payment detail
                        tetap bisa dites end-to-end tanpa menunggu credential
                        sandbox DOKU asli.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                                Order
                            </div>
                            <div className="mt-2 text-xl font-semibold">
                                {order.orderNumber}
                            </div>
                            <div className="mt-1 text-sm text-stone-300">
                                {order.customerName}
                            </div>
                            <div className="text-sm text-stone-400">
                                {order.customerEmail}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                                Current State
                            </div>
                            <div className="mt-3">
                                <StatusPill status={payment.status} />
                            </div>
                            <div className="mt-3 text-sm text-stone-300">
                                Reference: {payment.providerReference ?? 'N/A'}
                            </div>
                            <div className="text-sm text-stone-400">
                                Request ID: {payment.requestId ?? 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                                Order Detail
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                                {formatCurrency(order.amount, order.currency)}
                            </h2>
                        </div>
                        <StatusPill status={order.status} />
                    </div>

                    <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Line items
                        </div>
                        <div className="mt-3 space-y-3">
                            {order.lineItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                                >
                                    <div>
                                        <div className="font-semibold text-stone-900">
                                            {item.name}
                                        </div>
                                        <div className="text-xs uppercase tracking-[0.18em] text-stone-500">
                                            Qty {item.quantity}
                                        </div>
                                    </div>
                                    <div className="font-semibold text-stone-900">
                                        {formatCurrency(item.price, order.currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                            Simulate outcome
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {outcomes.map((outcome) => (
                                <button
                                    key={outcome.status}
                                    type="button"
                                    onClick={() => submit(outcome.status)}
                                    className={`rounded-2xl px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition ${outcome.tone}`}
                                >
                                    {outcome.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </AppShell>
    );
}
