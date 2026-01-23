import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { Tractor, ShoppingCart, Banknote, Wrench } from 'lucide-react';

async function getStats(userId: string) {
  const client = await pool.connect();
  try {
    const stockRes = await client.query(`
      SELECT 
        SUM(s.current_stock) as total_stock
      FROM (
        SELECT 
          s.id, 
                  COALESCE(SUM(CASE WHEN t.type IN ('production', 'purchase') THEN t.amount ELSE -t.amount END), 0) as current_stock
        FROM stacks s
        LEFT JOIN transactions t ON s.id = t.stack_id
        WHERE s.user_id = $1
        GROUP BY s.id
      ) s
    `, [userId]);

    const activityRes = await client.query(`
      SELECT t.*, s.name as stack_name, s.commodity
      FROM transactions t
      LEFT JOIN stacks s ON t.stack_id = s.id
      WHERE t.user_id = $1
      ORDER BY t.date DESC
      LIMIT 5
    `, [userId]);

    return {
      totalStock: stockRes.rows[0]?.total_stock || 0,
      recentActivity: activityRes.rows
    };
  } finally {
    client.release();
  }
}

export default async function Dashboard() {
  const session = await auth();

  const stats = session?.user?.id ? await getStats(session.user.id) : { totalStock: 0, recentActivity: [] };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card">
          <span className="label-modern">Total Stock</span>
          <div className="text-4xl font-extrabold my-2" style={{ color: 'var(--primary-light)' }}>
            {stats.totalStock.toLocaleString()}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Bales on hand</p>
        </div>
        {/* Action Buttons */}
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/log?type=production" className="glass-card flex flex-col items-center justify-center py-6 hover:brightness-110 transition-all active:scale-95 text-center group border-2 border-transparent hover:border-[#F8B195]">
            <Tractor size={32} style={{ color: '#F8B195', marginBottom: '8px' }} />
            <span className="font-bold text-lg" style={{ color: '#F8B195' }}>Bale</span>
            <span className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Record Production</span>
          </Link>
          <Link href="/log?type=purchase" className="glass-card flex flex-col items-center justify-center py-6 hover:brightness-110 transition-all active:scale-95 text-center group border-2 border-transparent hover:border-[#F67280]">
            <ShoppingCart size={32} style={{ color: '#F67280', marginBottom: '8px' }} />
            <span className="font-bold text-lg" style={{ color: '#F67280' }}>Buy</span>
            <span className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Record Purchase</span>
          </Link>
          <Link href="/log?type=sale" className="glass-card flex flex-col items-center justify-center py-6 hover:brightness-110 transition-all active:scale-95 text-center group border-2 border-transparent hover:border-[#C06C84]">
            <Banknote size={32} style={{ color: '#C06C84', marginBottom: '8px' }} />
            <span className="font-bold text-lg" style={{ color: '#C06C84' }}>Sell</span>
            <span className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Record Sale</span>
          </Link>
          <Link href="/log?type=adjustment" className="glass-card flex flex-col items-center justify-center py-6 hover:brightness-110 transition-all active:scale-95 text-center group border-2 border-transparent hover:border-[#6C5B7B]">
            <Wrench size={32} style={{ color: '#6C5B7B', marginBottom: '8px' }} />
            <span className="font-bold text-lg" style={{ color: '#6C5B7B' }}>Adjust</span>
            <span className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Fix Inventory</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>Recent Activity</h2>
        <div className="flex flex-col gap-2">
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-dim)' }}>No recent activity found.</div>
          ) : (
            stats.recentActivity.map((tx: any) => (
              <div key={tx.id} className="glass-card flex items-center justify-between py-4 px-5 !rounded-2xl">
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                    {tx.type === 'production' ? 'Baled' : tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}: {tx.stack_name || 'Unknown Stack'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {tx.commodity} • {new Date(tx.date).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className="font-mono font-bold"
                  style={{ color: tx.type === 'sale' ? '#ef4444' : 'var(--primary-light)' }}
                >
                  {tx.type === 'sale' ? '−' : '+'}{Number(tx.amount).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!session && (
        <div className="glass-card text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>Sign in to manage your inventory</p>
          <Link href="/api/auth/signin" className="btn btn-primary w-full">Sign In</Link>
        </div>
      )}
    </div>
  );
}
