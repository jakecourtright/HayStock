'use client';

import Link from "next/link";
import { Pencil } from "lucide-react";

interface LocationCardProps {
    location: {
        id: number;
        name: string;
        capacity: number;
        unit: string;
        total_stock: number;
        stack_count: number;
    };
}

export default function LocationCard({ location }: LocationCardProps) {
    const percentUsed = Math.min(100, Math.round((location.total_stock / location.capacity) * 100));
    const isNearCapacity = percentUsed > 90;

    return (
        <Link href={`/locations/${location.id}`} className="block">
            <div className="glass-card p-5 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">{location.name}</h3>
                        <span className="text-sm text-slate-400">
                            {location.total_stock.toLocaleString()} / {location.capacity.toLocaleString()} {location.unit}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`font-semibold ${isNearCapacity ? 'text-red-400' : 'text-emerald-400'}`}>
                            {percentUsed}%
                        </span>
                        <Link
                            href={`/locations/${location.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <Pencil size={14} />
                        </Link>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white/5 h-2 rounded-full overflow-hidden mb-3">
                    <div
                        className={`h-full rounded-full transition-all ${isNearCapacity ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${percentUsed}%` }}
                    />
                </div>

                <div className="text-xs text-slate-400">
                    {location.stack_count} {location.stack_count === 1 ? 'lot' : 'lots'} stored here
                </div>
            </div>
        </Link>
    );
}
