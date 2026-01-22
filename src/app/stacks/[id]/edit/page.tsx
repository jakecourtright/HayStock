import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { updateStack } from "@/app/actions";

async function getStack(stackId: string, userId: string) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM stacks WHERE id = $1 AND user_id = $2',
            [stackId, userId]
        );
        return result.rows[0] || null;
    } finally {
        client.release();
    }
}

export default async function EditStackPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const { id } = await params;
    const stack = await getStack(id, session.user.id);

    if (!stack) {
        notFound();
    }

    const updateWithId = updateStack.bind(null, id);

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">Edit Stack</h1>

            <form action={updateWithId} className="glass-card p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Lot/Stack Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        defaultValue={stack.name}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Commodity
                    </label>
                    <select
                        name="commodity"
                        defaultValue={stack.commodity}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="Alfalfa">Alfalfa</option>
                        <option value="Timothy">Timothy</option>
                        <option value="Bermuda">Bermuda</option>
                        <option value="Oat Hay">Oat Hay</option>
                        <option value="Orchard Grass">Orchard Grass</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                            Bale Size
                        </label>
                        <select
                            name="baleSize"
                            defaultValue={stack.bale_size}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="Small Square">Small Square</option>
                            <option value="Large Square">Large Square</option>
                            <option value="Round">Round</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                            Quality
                        </label>
                        <select
                            name="quality"
                            defaultValue={stack.quality}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="Premium">Premium</option>
                            <option value="#1">#1</option>
                            <option value="Feeder">Feeder</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Base Price ($/unit)
                    </label>
                    <input
                        type="number"
                        name="basePrice"
                        step="0.01"
                        defaultValue={stack.base_price}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4">
                    Update Stack
                </button>
            </form>
        </div>
    );
}
