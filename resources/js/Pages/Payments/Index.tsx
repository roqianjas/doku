import StatusPill from '@/Components/StatusPill';
import AppShell from '@/Layouts/AppShell';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

type PaymentRow = {
    id: number;
    orderNumber: string;
    customerName: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    providerReference: string | null;
    detailUrl: string | null;
    updatedAt: string | null;
};

type PaymentsIndexProps = PageProps<{
    payments: {
        data: PaymentRow[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    summary: {
        all: number;
        pending: number;
        paid: number;
        failed: number;
    };
}>;

export default function PaymentsIndex({
    payments,
    summary,
}: PaymentsIndexProps) {
    return (
        <AppShell>
            <Head title="Transactions" />

            <section className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                            Transaction Console
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-stone-950">
                            Orders, payments, dan event trail
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                            Halaman ini menampilkan payment record yang dibentuk
                            app host dari package DOKU, termasuk status terakhir,
                            metode pembayaran, dan jalur ke detail event log.
                        </p>
                    </div>

                    <Link
                        href={route('home')}
                        className="inline-flex rounded-full border border-stone-900/10 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-900 hover:text-white"
                    >
                        Back to launcher
                    </Link>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'All', value: summary.all },
                        { label: 'Pending', value: summary.pending },
                        { label: 'Paid', value: summary.paid },
                        { label: 'Failed', value: summary.failed },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-3xl border border-stone-200 bg-stone-50 p-5"
                        >
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                                {item.label}
                            </div>
                            <div className="mt-3 text-3xl font-semibold text-stone-950">
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-6 rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                <div className="space-y-4">
                    {payments.data.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-12 text-center text-sm leading-7 text-stone-500">
                            Belum ada transaksi yang tersimpan. Mulai dari halaman Home untuk membuat checkout pertama.
                        </div>
                    ) : (
                        payments.data.map((payment) => (
                            <div
                                key={payment.id}
                                className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                                            {payment.orderNumber}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-xl font-semibold text-stone-950">
                                                {payment.customerName}
                                            </h2>
                                            <StatusPill status={payment.status} />
                                        </div>
                                        <p className="text-sm leading-7 text-stone-600">
                                            {formatCurrency(
                                                payment.amount,
                                                payment.currency,
                                            )}
                                            {' · '}
                                            {payment.paymentMethod ??
                                                'Payment method belum tercatat'}
                                            {' · '}
                                            {payment.providerReference ??
                                                'Reference belum tersedia'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                        <div className="text-sm text-stone-500">
                                            {payment.updatedAt
                                                ? formatDateTime(
                                                      payment.updatedAt,
                                                  )
                                                : 'No timestamp'}
                                        </div>
                                        {payment.detailUrl ? (
                                            <Link
                                                href={payment.detailUrl}
                                                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                                            >
                                                Open detail
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </AppShell>
    );
}
