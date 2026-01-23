'use client';

import { submitTransaction } from "../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogFormProps {
    stacks: any[];
    locations: any[];
    type?: string;
}

export default function LogForm({ stacks, locations, type: initialType }: LogFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState(initialType || 'production');

    // If initialType is provided, lock the form to that type
    const isTypeLocked = !!initialType;

    const getPriceLabel = (type: string) => {
        switch (type) {
            case 'production': return 'Production Cost ($/unit)';
            case 'purchase': return 'Purchase Price ($/unit)';
            case 'sale': return 'Sale Price ($/unit)';
            case 'adjustment': return 'Value Adjustment ($/unit)';
            default: return 'Price / Cost ($/unit)';
        }
    };

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
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                {/* Type Selection - Hidden if type is locked */}
                <div className={isTypeLocked ? 'hidden' : ''}>
                    <label className="label-modern">Type</label>
                    <select
                        name="type"
                        className="select-modern"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="production">Production (In)</option>
                        <option value="sale">Sale (Out)</option>
                        <option value="purchase">Purchase (In)</option>
                        <option value="move">Move</option>
                        <option value="adjustment">Adjustment</option>
                    </select>
                </div>

                {/* Hidden input to ensure type is submitted when select is hidden */}
                {isTypeLocked && <input type="hidden" name="type" value={selectedType} />}

                <div className={isTypeLocked ? 'col-span-2' : ''}>
                    <label className="label-modern">Stack (Product)</label>
                    <select name="stackId" required className="select-modern">
                        <option value="">Select Stack...</option>
                        {stacks.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.commodity})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="label-modern">Destination Location</label>
                <select name="locationId" className="select-modern">
                    <option value="none">None (In Transit / Sold)</option>
                    {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label-modern">Amount</label>
                    <input type="number" name="amount" required step="0.01" className="input-modern" placeholder="0" />
                </div>
                <div>
                    <label className="label-modern">Unit</label>
                    <select name="unit" className="select-modern">
                        <option value="bales">Bales</option>
                        <option value="tons">Tons</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="label-modern">Entity / Notes</label>
                <input type="text" name="entity" className="input-modern" placeholder="Buyer Name / Field # / Notes" />
            </div>

            <div>
                <label className="label-modern">{getPriceLabel(selectedType)}</label>
                <input type="number" name="price" step="0.01" className="input-modern" placeholder="0.00" />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-6">
                {loading ? 'Logging...' : 'Log Transaction'}
            </button>
        </form>
    );
}
