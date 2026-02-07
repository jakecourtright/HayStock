interface StatCardProps {
    label: string;
    value: string;
    subtitle?: string;
    accent?: boolean;
}

export default function StatCard({ label, value, subtitle, accent = false }: StatCardProps) {
    return (
        <div className="glass-card flex items-center justify-between py-6 px-8">
            <div>
                <span className="label-modern" style={{ marginBottom: 0 }}>{label}</span>
                {subtitle && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>
                )}
            </div>
            <div
                className="text-4xl font-extrabold"
                style={{ color: accent ? 'var(--accent)' : 'var(--primary-light)' }}
            >
                {value}
            </div>
        </div>
    );
}
