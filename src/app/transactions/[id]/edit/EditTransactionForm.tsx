'use client';

import { updateTransaction, deleteTransaction } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

interface EditTransactionFormProps {
    transaction: {
        id: number;
        type: string;
        stack_id: number;
        location_id: number | null;
        amount: string;
        entity: string | null;
        price: string | null;
    };
    stacks: { id: number; name: string; commodity: string }[];
    locations: { id: number; name: string }[];
}

export default function EditTransactionForm({ transaction, stacks, locations }: EditTransactionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedType, setSelectedType] = useState(transaction.type);
    const [selectedStackId, setSelectedStackId] = useState(transaction.stack_id.toString());
    const [selectedLocationId, setSelectedLocationId] = useState(
        transaction.location_id ? transaction.location_id.toString() : 'none'
    );
    const [error, setError] = useState<string | null>(null);

    const updateWithId = updateTransaction.bind(null, transaction.id.toString());
    const deleteWithId = deleteTransaction.bind(null, transaction.id.toString());

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
        setError(null);

        const formData = new FormData(event.currentTarget);

        try {
            await updateWithId(formData);
        } catch (e: any) {
            setError(e.message || 'Error updating transaction. Please try again.');
            setLoading(false);
        }
    }

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteWithId();
        } catch (e: any) {
            setError(e.message || 'Error deleting transaction.');
            setLoading(false);
        }
    }

    const typeOptions = [
        { value: 'production', label: 'Production (In)' },
        { value: 'sale', label: 'Sale (Out)' },
        { value: 'purchase', label: 'Purchase (In)' },
        { value: 'adjustment', label: 'Adjustment' },
    ];

    const stackOptions = [
        { value: '', label: 'Select Stack...' },
        ...stacks.map(s => ({ value: String(s.id), label: `${s.name} (${s.commodity})` })),
    ];

    const locationOptions = [
        { value: 'none', label: 'None (In Transit / Sold)' },
        ...locations.map(l => ({ value: String(l.id), label: l.name })),
    ];

    const unitOptions = [
        { value: 'bales', label: 'Bales' },
        { value: 'tons', label: 'Tons' },
    ];

    const priceUnitOptions = [
        { value: 'ton', label: '$ / Ton' },
        { value: 'bale', label: '$ / Bale' },
    ];

    return (
        <>
            <form onSubmit={handleSubmit} className="glass-card space-y-5">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-modern">Type</label>
                        <CustomSelect
                            name="type"
                            options={typeOptions}
                            value={selectedType}
                            onChange={setSelectedType}
                        />
                    </div>

                    <div>
                        <label className="label-modern">Stack (Product)</label>
                        <CustomSelect
                            name="stackId"
                            required
                            options={stackOptions}
                            value={selectedStackId}
                            onChange={setSelectedStackId}
                        />
                    </div>
                </div>

                <div>
                    <label className="label-modern">
                        {selectedType === 'sale' ? 'Source Location' : 'Destination Location'}
                    </label>
                    <CustomSelect
                        name="locationId"
                        options={locationOptions}
                        value={selectedLocationId}
                        onChange={setSelectedLocationId}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-modern">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            required
                            step="0.01"
                            className="input-modern"
                            defaultValue={parseFloat(transaction.amount)}
                        />
                    </div>
                    <div>
                        <label className="label-modern">Unit</label>
                        <CustomSelect
                            name="unit"
                            options={unitOptions}
                            defaultValue="bales"
                        />
                    </div>
                </div>

                <div>
                    <label className="label-modern">Entity / Notes</label>
                    <input
                        type="text"
                        name="entity"
                        className="input-modern"
                        placeholder="Buyer Name / Field # / Notes"
                        defaultValue={transaction.entity || ''}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-modern">{getPriceLabel(selectedType)}</label>
                        <input
                            type="number"
                            name="price"
                            step="0.01"
                            className="input-modern"
                            placeholder="0.00"
                            defaultValue={transaction.price ? parseFloat(transaction.price) : ''}
                        />
                    </div>
                    <div>
                        <label className="label-modern">Price Per</label>
                        <CustomSelect
                            name="priceUnit"
                            options={priceUnitOptions}
                            defaultValue="ton"
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full mt-6">
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            {/* Delete Section */}
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <Trash2 size={18} />
                        Delete Transaction
                    </button>
                ) : (
                    <div className="glass-card p-4 text-center" style={{ borderColor: '#ef4444' }}>
                        <p className="mb-4" style={{ color: 'var(--accent)' }}>
                            Are you sure? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 rounded-xl"
                                style={{ background: 'var(--bg-surface)', color: 'var(--text-dim)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 py-2 rounded-xl"
                                style={{ background: '#ef4444', color: 'white' }}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
