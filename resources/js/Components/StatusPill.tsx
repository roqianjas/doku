type StatusPillProps = {
    status: string;
    label?: string;
};

const tones: Record<string, string> = {
    created: 'border-slate-300 bg-slate-100 text-slate-700',
    pending: 'border-amber-300 bg-amber-100 text-amber-800',
    paid: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    failed: 'border-rose-300 bg-rose-100 text-rose-800',
    expired: 'border-zinc-300 bg-zinc-200 text-zinc-800',
    cancelled: 'border-zinc-300 bg-zinc-200 text-zinc-800',
    refunded: 'border-sky-300 bg-sky-100 text-sky-800',
    unknown: 'border-slate-300 bg-slate-100 text-slate-700',
};

export default function StatusPill({ status, label }: StatusPillProps) {
    const normalizedStatus = status.toLowerCase();

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                tones[normalizedStatus] ?? tones.unknown
            }`}
        >
            {label ?? normalizedStatus}
        </span>
    );
}
