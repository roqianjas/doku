import FlashBanner from '@/Components/FlashBanner';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function AppShell({ children }: PropsWithChildren) {
    const { app, auth } = usePage<PageProps>().props;
    const isFakeMode = app.doku.driver === 'fake';

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.28),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,63,94,0.16),_transparent_24%),linear-gradient(180deg,_#fffdf8_0%,_#f7f1e5_54%,_#efe3cd_100%)] text-stone-900">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
                <header className="px-4 pb-6 pt-5 sm:px-6 lg:px-8">
                    <div className="rounded-[28px] border border-stone-900/10 bg-white/75 px-5 py-4 shadow-[0_24px_80px_rgba(120,53,15,0.08)] backdrop-blur">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <Link href={route('home')} className="group">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-900 text-sm font-black uppercase tracking-[0.22em] text-orange-200 transition group-hover:rotate-6 group-hover:bg-orange-600 group-hover:text-white">
                                            DK
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
                                                {app.name}
                                            </div>
                                            <div className="text-lg font-semibold text-stone-900">
                                                Laravel + DOKU Lab
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-stone-600">
                                <Link
                                    href={route('home')}
                                    className="rounded-full px-4 py-2 transition hover:bg-stone-900 hover:text-white"
                                >
                                    Home
                                </Link>
                                <Link
                                    href={route('payments.index')}
                                    className="rounded-full px-4 py-2 transition hover:bg-stone-900 hover:text-white"
                                >
                                    Transactions
                                </Link>
                                {auth.user ? (
                                    <Link
                                        href={route('profile.edit')}
                                        className="rounded-full px-4 py-2 transition hover:bg-stone-900 hover:text-white"
                                    >
                                        {auth.user.name}
                                    </Link>
                                ) : null}
                                <span
                                    className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                                        isFakeMode
                                            ? 'border-amber-300 bg-amber-100 text-amber-900'
                                            : 'border-emerald-300 bg-emerald-100 text-emerald-900'
                                    }`}
                                >
                                    {app.doku.environment} / {app.doku.driver}
                                </span>
                            </nav>
                        </div>
                    </div>
                </header>

                <FlashBanner />

                <main className="flex-1 px-4 pb-12 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
