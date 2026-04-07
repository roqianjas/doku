import StatusPill from '@/Components/StatusPill';
import AppShell from '@/Layouts/AppShell';
import {
    formatCurrency,
    formatDateTime,
    formatStatusLabel,
} from '@/lib/format';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

type PaymentShowProps = PageProps<{
    isReturnVisit: boolean;
    order: {
        id: number;
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
        createdAt: string | null;
    };
    payment: {
        id: number;
        provider: string;
        providerReference: string | null;
        requestId: string | null;
        paymentMethod: string | null;
        amount: number;
        currency: string;
        status: string;
        checkoutUrl: string | null;
        paidAt: string | null;
        expiredAt: string | null;
        rawResponseSummary: Record<string, unknown> | null;
    } | null;
    events: Array<{
        id: number;
        eventType: string;
        source: string;
        signatureStatus: string | null;
        processedAt: string | null;
        createdAt: string | null;
        payload: Record<string, unknown> | null;
    }>;
}>;

export default function PaymentShow({
    isReturnVisit,
    order,
    payment,
    events,
}: PaymentShowProps) {
    const { app } = usePage<PageProps>().props;
    const isGatewayMode = app.doku.driver === 'checkout';

    const handleSync = () => {
        if (!payment) {
            return;
        }

        router.post(route('payments.sync', payment.id));
    };

    return (
        <AppShell>
            <Head title={`Payment ${order.orderNumber}`} />

            <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
                <div className="space-y-6">
                    <div className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                                    Order Snapshot
                                </p>
                                <h1 className="mt-2 text-3xl font-semibold text-stone-950">
                                    {order.orderNumber}
                                </h1>
                            </div>
                            <StatusPill status={payment?.status ?? order.status} />
                        </div>

                        {isReturnVisit ? (
                            <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
                                Customer baru saja kembali dari flow pembayaran.
                                Status final tetap dibaca dari data internal
                                terbaru, jadi halaman ini aman dipakai sebagai
                                return page.
                            </div>
                        ) : null}

                        <div className="mt-6 space-y-4 text-sm leading-7 text-stone-600">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                    Customer
                                </div>
                                <div className="mt-1 text-base font-semibold text-stone-950">
                                    {order.customerName}
                                </div>
                                <div>{order.customerEmail}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                    Amount
                                </div>
                                <div className="mt-1 text-base font-semibold text-stone-950">
                                    {formatCurrency(order.amount, order.currency)}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                    Created
                                </div>
                                <div className="mt-1">
                                    {order.createdAt
                                        ? formatDateTime(order.createdAt)
                                        : 'No timestamp'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                Line Items
                            </div>
                            <div className="mt-3 space-y-3">
                                {order.lineItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3"
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
                                            {formatCurrency(
                                                item.price,
                                                order.currency,
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                                    Payment Controls
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                                    Next action
                                </h2>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {payment?.checkoutUrl ? (
                                <a
                                    href={payment.checkoutUrl}
                                    className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                                >
                                    Open checkout page
                                </a>
                            ) : null}

                            {payment && isGatewayMode ? (
                                <button
                                    type="button"
                                    onClick={handleSync}
                                    className="rounded-full border border-stone-900/10 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-900 hover:text-white"
                                >
                                    Manual status sync
                                </button>
                            ) : null}

                            <Link
                                href={route('payments.index')}
                                className="rounded-full border border-stone-900/10 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-900 hover:text-white"
                            >
                                Back to transactions
                            </Link>
                        </div>

                        {!isGatewayMode ? (
                            <p className="mt-4 text-sm leading-7 text-stone-500">
                                Driver fake aktif, jadi perubahan status
                                dilakukan dari sandbox lokal alih-alih API DOKU
                                asli.
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                            Payment Record
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                            Gateway state and metadata
                        </h2>

                        {payment ? (
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {[
                                    ['Provider', payment.provider.toUpperCase()],
                                    ['Reference', payment.providerReference ?? 'N/A'],
                                    ['Request ID', payment.requestId ?? 'N/A'],
                                    [
                                        'Payment method',
                                        payment.paymentMethod ?? 'Pending',
                                    ],
                                    [
                                        'Amount',
                                        formatCurrency(
                                            payment.amount,
                                            payment.currency,
                                        ),
                                    ],
                                    [
                                        'Paid at',
                                        payment.paidAt
                                            ? formatDateTime(payment.paidAt)
                                            : 'Not paid yet',
                                    ],
                                    [
                                        'Expired at',
                                        payment.expiredAt
                                            ? formatDateTime(payment.expiredAt)
                                            : 'Not expired',
                                    ],
                                    [
                                        'Internal status',
                                        formatStatusLabel(payment.status),
                                    ],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-3xl border border-stone-200 bg-stone-50 p-4"
                                    >
                                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                            {label}
                                        </div>
                                        <div className="mt-2 text-sm font-semibold leading-7 text-stone-900">
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-sm leading-7 text-stone-500">
                                Payment record belum tersedia untuk order ini.
                            </div>
                        )}
                    </div>

                    <div className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                            Event Timeline
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                            Audit trail
                        </h2>

                        <div className="mt-6 space-y-4">
                            {events.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-sm leading-7 text-stone-500">
                                    Event log belum ada untuk payment ini.
                                </div>
                            ) : (
                                events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="rounded-3xl border border-stone-200 bg-stone-50 p-5"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                                    {event.source}
                                                </div>
                                                <div className="mt-1 text-lg font-semibold text-stone-950">
                                                    {event.eventType}
                                                </div>
                                            </div>
                                            <div className="text-sm text-stone-500">
                                                {event.processedAt
                                                    ? formatDateTime(
                                                          event.processedAt,
                                                      )
                                                    : event.createdAt
                                                      ? formatDateTime(
                                                            event.createdAt,
                                                        )
                                                      : 'No timestamp'}
                                            </div>
                                        </div>

                                        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                            Signature status:{' '}
                                            {event.signatureStatus ?? 'N/A'}
                                        </div>

                                        <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-4 text-xs leading-6 text-stone-200">
                                            {JSON.stringify(
                                                event.payload ?? {},
                                                null,
                                                2,
                                            )}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </AppShell>
    );
}
