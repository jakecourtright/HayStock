import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createLocation } from "@/app/actions";

export default async function NewLocationPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">New Location</h1>

            <form action={createLocation} className="glass-card p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Location Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="e.g., Barn A"
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
                            placeholder="2000"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                            Unit
                        </label>
                        <select
                            name="unit"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="bales">Bales</option>
                            <option value="tons">Tons</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4">
                    Create Location
                </button>
            </form>
        </div>
    );
}
