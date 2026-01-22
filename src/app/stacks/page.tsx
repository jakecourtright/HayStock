import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getStacks(userId: string) {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM stacks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
    } finally {
        client.release();
    }
}

export default async function StacksPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const stacks = await getStacks(session.user.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Product Definitions (Stacks)</h1>
                <Link href="/stacks/new" className="text-xs font-semibold px-3 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 text-white">
                    + New Stack
                </Link>
            </div>

            <div className="grid gap-4">
                {stacks.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        No stacks defined. Create one to start logging production.
                    </div>
                ) : (
                    stacks.map((stack: any) => (
                        <div key={stack.id} className="glass-card">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{stack.name}</h3>
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{stack.commodity}</span>
                                </div>
                                <div className="text-right">
                                    {/* We could calculate current stock here if we joined, but simpler query for now */}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-400">
                                    {stack.quality}
                                </span>
                                <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-400">
                                    {stack.bale_size}
                                </span>
                                <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-400">
                                    ${stack.base_price}/unit
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
