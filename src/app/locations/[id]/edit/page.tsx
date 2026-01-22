import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { updateLocation, deleteLocation } from "@/app/actions";
import DeleteButton from "./DeleteButton";

async function getLocation(locationId: string, userId: string) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM locations WHERE id = $1 AND user_id = $2',
            [locationId, userId]
        );
        return result.rows[0] || null;
    } finally {
        client.release();
    }
}

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const { id } = await params;
    const location = await getLocation(id, session.user.id);

    if (!location) {
        notFound();
    }

    const updateWithId = updateLocation.bind(null, id);

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">Edit Location</h1>

            <form action={updateWithId} className="glass-card p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Location Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        defaultValue={location.name}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                            Capacity
                        </label>
                        <input
                            type="number"
                            name="capacity"
                            required
                            defaultValue={location.capacity}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                            Unit
                        </label>
                        <select
                            name="unit"
                            defaultValue={location.unit}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="bales">Bales</option>
                            <option value="tons">Tons</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4">
                    Update Location
                </button>
            </form>

            <div className="mt-6">
                <DeleteButton locationId={id} />
            </div>
        </div>
    );
}
