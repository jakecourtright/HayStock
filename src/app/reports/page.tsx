import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { redirect } from "next/navigation";

async function getReportData(userId: string) {
    const client = await pool.connect();
    try {
        // Get production totals
        const productionResult = await client.query(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = $1 AND type = 'production'
        `, [userId]);

        // Get sales totals and revenue
        const salesResult = await client.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_units,
                COALESCE(SUM(amount * price), 0) as total_revenue
            FROM transactions
            WHERE user_id = $1 AND type = 'sale'
        `, [userId]);

        // Get purchase totals
        const purchaseResult = await client.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_units,
                COALESCE(SUM(amount * price), 0) as total_cost
            FROM transactions
            WHERE user_id = $1 AND type = 'purchase'
        `, [userId]);

        return {
            production: parseFloat(productionResult.rows[0].total),
            sales: {
                units: parseFloat(salesResult.rows[0].total_units),
                revenue: parseFloat(salesResult.rows[0].total_revenue)
            },
            purchases: {
                units: parseFloat(purchaseResult.rows[0].total_units),
                cost: parseFloat(purchaseResult.rows[0].total_cost)
            }
        };
    } finally {
        client.release();
    }
}

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const data = await getReportData(session.user.id);

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">Reports</h1>

            <div className="grid gap-4">
                {/* Production Card */}
                <div className="glass-card">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Production Yield
                    </span>
                    <div className="text-3xl font-bold text-white mt-2">
                        {data.production.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                        Total units baled from fields
                    </p>
                </div>

                {/* Sales Card */}
                <div className="glass-card">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Sales Revenue
                    </span>
                    <div className="text-3xl font-bold text-emerald-400 mt-2">
                        ${data.sales.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                        From {data.sales.units.toLocaleString()} units sold
                    </p>
                </div>

                {/* Purchases Card */}
                <div className="glass-card">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Purchases
                    </span>
                    <div className="text-3xl font-bold text-amber-400 mt-2">
                        ${data.purchases.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                        {data.purchases.units.toLocaleString()} units purchased
                    </p>
                </div>

                {/* Net Profit Card */}
                <div className="glass-card border-2 border-emerald-500/30">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Net Position
                    </span>
                    <div className={`text-3xl font-bold mt-2 ${data.sales.revenue - data.purchases.cost >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${(data.sales.revenue - data.purchases.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                        Sales revenue minus purchase costs
                    </p>
                </div>
            </div>
        </div>
    );
}
