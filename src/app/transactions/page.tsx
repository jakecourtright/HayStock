import { auth } from "@clerk/nextjs/server";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tractor, ShoppingCart, Banknote, Wrench } from "lucide-react";
import { balesToTons, getDefaultWeight } from "@/lib/units";

async function getAllTransactions(orgId: string) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT 
                t.*,
                s.name as stack_name,
                s.commodity,
                s.bale_size,
                s.weight_per_bale,
                l.name as location_name
            FROM transactions t
            LEFT JOIN stacks s ON s.id = t.stack_id
            LEFT JOIN locations l ON l.id = t.location_id
            WHERE t.org_id = $1
            ORDER BY t.date DESC
        `, [orgId]);

        return result.rows;
    } finally {
        client.release();
    }
}

function getTransactionIcon(type: string) {
    switch (type) {
        case 'production': return <Tractor size={16} />;
        case 'purchase': return <ShoppingCart size={16} />;
        case 'sale': return <Banknote size={16} />;
        default: return <Wrench size={16} />;
    }
}

function getTransactionLabel(type: string) {
    switch (type) {
        case 'production': return 'Baled';
        case 'purchase': return 'Purchased';
        case 'sale': return 'Sold';
        case 'adjustment': return 'Adjusted';
        default: return 'Transaction';
    }
}

export default async function TransactionsPage() {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) redirect("/sign-in");

    const transactions = await getAllTransactions(orgId);

    // Group transactions by date
    const groupedByDate: Record<string, typeof transactions> = {};
    transactions.forEach(tx => {
        const dateKey = new Date(tx.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(tx);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="p-2 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-surface)' }}
                >
                    <ArrowLeft size={20} style={{ color: 'var(--text-dim)' }} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                        All Transactions
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                        {transactions.length} total transactions
                    </p>
                </div>
            </div>

            {/* Transactions grouped by date */}
            {Object.keys(groupedByDate).length === 0 ? (
                <div className="glass-card text-center py-12" style={{ color: 'var(--text-dim)' }}>
                    No transactions yet
                </div>
            ) : (
                Object.entries(groupedByDate).map(([date, txList]) => (
                    <div key={date}>
                        <h2 className="text-sm font-bold mb-3 uppercase" style={{ color: 'var(--text-dim)' }}>
                            {date}
                        </h2>
                        <div className="space-y-2">
                            {txList.map((tx: any) => {
                                const amount = parseFloat(tx.amount);
                                const weight = tx.weight_per_bale || getDefaultWeight(tx.bale_size || '3x4');
                                const tons = balesToTons(amount, weight);
                                const txColor = tx.type === 'sale' ? '#ef4444' : 'var(--primary-light)';

                                return (
                                    <Link key={tx.id} href={`/transactions/${tx.id}`} className="block">
                                        <div className="glass-card p-4 hover:brightness-110 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="p-2 rounded-lg"
                                                        style={{
                                                            background: tx.type === 'sale' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(var(--primary-rgb), 0.2)',
                                                            color: txColor
                                                        }}
                                                    >
                                                        {getTransactionIcon(tx.type)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: 'var(--accent)' }}>
                                                            {getTransactionLabel(tx.type)}: {tx.stack_name || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                                                            {tx.location_name || 'No location'} {tx.entity && `• ${tx.entity}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg" style={{ color: txColor }}>
                                                        {tx.type === 'sale' ? '−' : '+'}{amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                                                        {tons.toFixed(2)} tons
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
