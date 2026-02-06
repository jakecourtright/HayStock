import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tractor, ShoppingCart, Banknote, Wrench, MapPin, Package, Pencil } from "lucide-react";
import { balesToTons, resolveWeight } from "@/lib/units";

async function getTransaction(transactionId: string, orgId: string) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT 
                t.*,
                s.name as stack_name,
                s.commodity,
                s.bale_size,
                s.weight_per_bale,
                s.price_unit,
                l.name as location_name
            FROM transactions t
            LEFT JOIN stacks s ON s.id = t.stack_id
            LEFT JOIN locations l ON l.id = t.location_id
            WHERE t.id = $1 AND t.org_id = $2
        `, [transactionId, orgId]);

        return result.rows[0] || null;
    } finally {
        client.release();
    }
}

function getTransactionIcon(type: string) {
    switch (type) {
        case 'production': return <Tractor size={24} />;
        case 'purchase': return <ShoppingCart size={24} />;
        case 'sale': return <Banknote size={24} />;
        default: return <Wrench size={24} />;
    }
}

function getTransactionLabel(type: string) {
    switch (type) {
        case 'production': return 'Production';
        case 'purchase': return 'Purchase';
        case 'sale': return 'Sale';
        case 'adjustment': return 'Adjustment';
        default: return 'Transaction';
    }
}

function getTransactionColor(type: string) {
    return type === 'sale' ? '#ef4444' : 'var(--primary-light)';
}

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) redirect("/sign-in");

    const { id } = await params;
    const tx = await getTransaction(id, orgId);

    if (!tx) {
        notFound();
    }

    const amount = parseFloat(tx.amount);
    const weight = resolveWeight(tx.weight_per_bale, tx.bale_size);
    const tons = balesToTons(amount, weight);
    const txColor = getTransactionColor(tx.type);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/transactions"
                    className="p-2 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-surface)' }}
                >
                    <ArrowLeft size={20} style={{ color: 'var(--text-dim)' }} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                        Transaction Details
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                        {new Date(tx.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <Link
                    href={`/transactions/${id}/edit`}
                    className="p-2 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-surface)' }}
                >
                    <Pencil size={18} style={{ color: 'var(--text-dim)' }} />
                </Link>
            </div>

            {/* Main Info Card */}
            <div className="glass-card">
                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="p-4 rounded-xl"
                        style={{
                            background: tx.type === 'sale' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(var(--primary-rgb), 0.2)',
                            color: txColor
                        }}
                    >
                        {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-dim)' }}>
                            {getTransactionLabel(tx.type)}
                        </p>
                        <p className="text-3xl font-bold" style={{ color: txColor }}>
                            {tx.type === 'sale' ? '−' : '+'}{amount.toLocaleString()} <span className="text-lg">bales</span>
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                            {tons.toFixed(2)} tons
                        </p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    {/* Stack/Product */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Package size={14} style={{ color: 'var(--text-dim)' }} />
                            <span className="text-xs uppercase" style={{ color: 'var(--text-dim)' }}>Product</span>
                        </div>
                        <Link href={`/stacks/${tx.stack_id}`} className="hover:opacity-80 transition-opacity">
                            <p className="font-semibold" style={{ color: 'var(--accent)' }}>{tx.stack_name}</p>
                            <p className="text-xs" style={{ color: 'var(--primary-light)' }}>{tx.commodity}</p>
                        </Link>
                    </div>

                    {/* Location */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin size={14} style={{ color: 'var(--text-dim)' }} />
                            <span className="text-xs uppercase" style={{ color: 'var(--text-dim)' }}>
                                {tx.type === 'sale' ? 'From' : 'To'}
                            </span>
                        </div>
                        {tx.location_name ? (
                            <Link href={`/locations/${tx.location_id}`} className="hover:opacity-80 transition-opacity">
                                <p className="font-semibold" style={{ color: 'var(--accent)' }}>
                                    {tx.location_name}
                                </p>
                            </Link>
                        ) : (
                            <p style={{ color: 'var(--text-dim)' }}>No location</p>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <span className="text-xs uppercase block mb-1" style={{ color: 'var(--text-dim)' }}>Price</span>
                        <p className="font-semibold" style={{ color: 'var(--accent)' }}>
                            ${parseFloat(tx.price || 0).toFixed(2)}
                            <span className="text-xs ml-1" style={{ color: 'var(--text-dim)' }}>
                                /{tx.price_unit || 'bale'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Entity/Notes */}
                {tx.entity && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <span className="text-xs uppercase block mb-1" style={{ color: 'var(--text-dim)' }}>
                            {tx.type === 'sale' ? 'Buyer' : tx.type === 'purchase' ? 'Seller' : 'Notes'}
                        </span>
                        <p style={{ color: 'var(--accent)' }}>{tx.entity}</p>
                    </div>
                )}
            </div>

            {/* Value Summary */}
            <div className="glass-card">
                <h2 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--text-dim)' }}>
                    Value Summary
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--text-dim)' }}>Quantity</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                            {amount.toLocaleString()} bales
                        </span>
                    </div>
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--text-dim)' }}>Weight</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                            {tons.toFixed(2)} tons
                        </span>
                    </div>
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--text-dim)' }}>Unit Price</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                            ${parseFloat(tx.price || 0).toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--text-dim)' }}>Total Value</span>
                        <span className="text-lg font-semibold" style={{ color: txColor }}>
                            ${(amount * parseFloat(tx.price || 0)).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
