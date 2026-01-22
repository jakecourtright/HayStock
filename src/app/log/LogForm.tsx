'use client';

import { submitTransaction } from "../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogForm({ stacks, locations }: { stacks: any[], locations: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            await submitTransaction(formData);
            alert('Transaction Logged!');
            router.push('/');
        } catch (e) {
            alert('Error logging transaction');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Type</label>
                    <select name="type" className="input-field w-full">
                        <option value="production">Production (In)</option>
                        <option value="sale">Sale (Out)</option>
                        <option value="purchase">Purchase (In)</option>
                        <option value="move">Move</option>
                        <option value="adjustment">Adjustment</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Stack (Product)</label>
                    <select name="stackId" required className="input-field w-full">
                        <option value="">Select Stack...</option>
                        {stacks.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.commodity})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Destination Location</label>
                <select name="locationId" className="input-field w-full">
                    <option value="none">None (In Transit / Sold)</option>
                    {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Amount</label>
                    <input type="number" name="amount" required step="0.01" className="input-field w-full" placeholder="0" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Unit</label>
                    <select name="unit" className="input-field w-full">
                        <option value="bales">Bales</option>
                        <option value="tons">Tons</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Entity / Notes</label>
                <input type="text" name="entity" className="input-field w-full" placeholder="Buyer Name / Field # / Notes" />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Price per Unit ($)</label>
                <input type="number" name="price" step="0.01" className="input-field w-full" placeholder="0.00" />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-6">
                {loading ? 'Logging...' : 'Log Transaction'}
            </button>

            <style jsx global>{`
        .input-field {
          @apply bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500;
        }
      `}</style>
        </form>
    );
}
