import AppShell from '@/Layouts/AppShell';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type HomeProps = PageProps<{
    product: {
        name: string;
        summary: string;
        price: number;
        currency: string;
        includes: string[];
    };
    integration: {
        driver: string;
        environment: string;
        ready: boolean;
        paymentDueDate: number;
    };
    metrics: {
        orders: number;
        pending: number;
        paid: number;
    };
    recentPayments: Array<{
        id: number;
        orderNumber: string;
        customerName: string;
        amount: string;
        status: string;
        paymentMethod: string | null;
        detailUrl: string | null;
        updatedAt: string | null;
    }>;
}>;

const metricCards = [
    { key: 'orders', label: 'Orders Created' },
    { key: 'pending', label: 'Pending Payments' },
    { key: 'paid', label: 'Paid Transactions' },
] as const;

export default function Home({
    product,
    integration,
    metrics,
    recentPayments,
}: HomeProps) {
    const { data, setData, post, processing, errors } = useForm({
        customer_name: 'Budi Santoso',
        customer_email: 'budi@example.com',
        amount: product.price,
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('checkout.demo'));
    };

    return (
        <AppShell>
            <Head title="DOKU Demo App" />

            <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="overflow-hidden rounded-[34px] border border-stone-900/10 bg-stone-950 px-6 py-8 text-white shadow-[0_30px_100px_rgba(28,25,23,0.28)] sm:px-8">
                    <div className="max-w-2xl">
                        <p className="mb-4 inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-200">
                            Reference Implementation
                        </p>
                        <h1 className="font-['Space_Grotesk','Segoe_UI',sans-serif] text-4xl font-bold tracking-tight sm:text-5xl">
                            Sample Laravel Inertia app yang langsung siap
                            ditenagai package DOKU reusable.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
                            {product.summary}
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            {metricCards.map((metric) => (
                                <div
                                    key={metric.key}
                                    className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                                        {metric.label}
                                    </div>
                                    <div className="mt-3 text-3xl font-semibold text-white">
                                        {metrics[metric.key]}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 rounded-[30px] border border-white/10 bg-white/5 p-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <span
                                    className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                                        integration.driver === 'fake'
                                            ? 'bg-amber-200 text-amber-950'
                                            : 'bg-emerald-200 text-emerald-950'
                                    }`}
                                >
                                    {integration.driver === 'fake'
                                        ? 'Demo mode aktif'
                                        : 'Gateway mode aktif'}
                                </span>
                                <span className="text-sm text-stone-300">
                                    Environment: {integration.environment}
                                </span>
                                <span className="text-sm text-stone-300">
                                    Due date: {integration.paymentDueDate} menit
                                </span>
                            </div>
                            <p className="mt-4 text-sm leading-7 text-stone-300">
                                {integration.ready
                                    ? 'Mode saat ini sudah siap dipakai. Jika driver fake aktif, checkout akan diarahkan ke sandbox lokal untuk simulasi sukses, gagal, expired, atau cancelled.'
                                    : 'Mode gateway aktif tetapi credential belum lengkap. Isi DOKU_CLIENT_ID dan DOKU_SECRET_KEY untuk mencoba checkout asli.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[34px] border border-stone-900/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.1)] backdrop-blur sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                                Demo Checkout
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                                {product.name}
                            </h2>
                        </div>
                        <div className="rounded-2xl bg-orange-100 px-4 py-3 text-right text-sm font-semibold text-orange-900">
                            {formatCurrency(product.price, product.currency)}
                        </div>
                    </div>

                    <ul className="mt-6 space-y-3 text-sm leading-6 text-stone-600">
                        {product.includes.map((item) => (
                            <li key={item} className="flex gap-3">
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">
                                Customer name
                            </span>
                            <input
                                type="text"
                                value={data.customer_name}
                                onChange={(event) =>
                                    setData('customer_name', event.target.value)
                                }
                                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            />
                            {errors.customer_name ? (
                                <p className="mt-2 text-sm text-rose-600">
                                    {errors.customer_name}
                                </p>
                            ) : null}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">
                                Customer email
                            </span>
                            <input
                                type="email"
                                value={data.customer_email}
                                onChange={(event) =>
                                    setData('customer_email', event.target.value)
                                }
                                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            />
                            {errors.customer_email ? (
                                <p className="mt-2 text-sm text-rose-600">
                                    {errors.customer_email}
                                </p>
                            ) : null}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">
                                Amount (IDR)
                            </span>
                            <input
                                type="number"
                                min={10000}
                                step={1000}
                                value={data.amount}
                                onChange={(event) =>
                                    setData('amount', Number(event.target.value))
                                }
                                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            />
                            {errors.amount ? (
                                <p className="mt-2 text-sm text-rose-600">
                                    {errors.amount}
                                </p>
                            ) : (
                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                                    Edit nominal untuk mencoba variasi transaksi.
                                </p>
                            )}
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-2xl bg-stone-950 px-5 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Preparing checkout...' : 'Create checkout'}
                        </button>
                    </form>
                </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[32px] border border-stone-900/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                                Package Shape
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                                `packages/doku-laravel`
                            </h3>
                        </div>
                        <Link
                            href={route('payments.index')}
                            className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-900 hover:text-white"
                        >
                            View transactions
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {[
                            'Contracts memisahkan app host dari detail gateway.',
                            'Checkout driver dapat diganti antara fake dan HTTP DOKU asli.',
                            'Webhook verifier memvalidasi signature non-SNAP dari request asli.',
                            'Status sync tetap tersedia sebagai jalur observability saat webhook terlambat.',
                        ].map((item) => (
                            <div
                                key={item}
                                className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-700"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[32px] border border-stone-900/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-700">
                                Recent Transactions
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                                Latest payment activity
                            </h3>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {recentPayments.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center text-sm leading-7 text-stone-500">
                                Belum ada transaksi yang tersimpan. Buat checkout pertama untuk melihat order, payment, dan event log muncul di sini.
                            </div>
                        ) : (
                            recentPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                                                {payment.orderNumber}
                                            </div>
                                            <div className="mt-1 text-lg font-semibold text-stone-900">
                                                {payment.customerName}
                                            </div>
                                            <div className="mt-1 text-sm text-stone-600">
                                                {formatCurrency(
                                                    Number(payment.amount),
                                                    product.currency,
                                                )}
                                                {' · '}
                                                {payment.paymentMethod ??
                                                    'Payment method pending'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-stone-600 sm:text-right">
                                            <div className="font-semibold uppercase tracking-[0.18em] text-stone-500">
                                                {payment.status}
                                            </div>
                                            <div className="mt-1">
                                                {payment.updatedAt
                                                    ? formatDateTime(
                                                          payment.updatedAt,
                                                      )
                                                    : 'No timestamp'}
                                            </div>
                                            {payment.detailUrl ? (
                                                <Link
                                                    href={payment.detailUrl}
                                                    className="mt-3 inline-flex rounded-full border border-stone-900/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-900 hover:text-white"
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
                </div>
            </section>
        </AppShell>
    );
}
