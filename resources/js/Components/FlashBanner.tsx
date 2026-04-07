import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

export default function FlashBanner() {
    const { flash } = usePage<PageProps>().props;

    if (!flash.success && !flash.error) {
        return null;
    }

    return (
        <div className="mx-auto mb-6 max-w-6xl px-4 sm:px-6 lg:px-8">
            {flash.success ? (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
                    {flash.success}
                </div>
            ) : null}

            {flash.error ? (
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-sm">
                    {flash.error}
                </div>
            ) : null}
        </div>
    );
}
