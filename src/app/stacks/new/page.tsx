'use client';

import { createStack } from "@/app/actions";
import { BALE_SIZES, BALE_SIZE_WEIGHTS } from "@/lib/units";
import { useState } from "react";
import CustomSelect from "@/components/CustomSelect";

export default function NewStackPage() {
    const [baleSize, setBaleSize] = useState('3x4');
    const [weightPerBale, setWeightPerBale] = useState(BALE_SIZE_WEIGHTS['3x4']);
    const [priceUnit, setPriceUnit] = useState<'bale' | 'ton'>('bale');

    const handleBaleSizeChange = (newSize: string) => {
        setBaleSize(newSize);
        // Prefill with default weight for this bale size
        setWeightPerBale(BALE_SIZE_WEIGHTS[newSize] || 1200);
    };

    const commodityOptions = [
        { value: 'Alfalfa', label: 'Alfalfa' },
        { value: 'Timothy', label: 'Timothy' },
        { value: 'Bermuda', label: 'Bermuda' },
        { value: 'Oat Hay', label: 'Oat Hay' },
        { value: 'Orchard Grass', label: 'Orchard Grass' },
        { value: 'Straw', label: 'Straw' },
        { value: 'Mixed Hay', label: 'Mixed Hay' },
    ];

    const baleSizeOptions = BALE_SIZES.map(size => ({ value: size, label: size }));

    const qualityOptions = [
        { value: 'Premium', label: 'Premium' },
        { value: '#1', label: '#1 (Good)' },
        { value: 'Feeder', label: 'Feeder / Economy' },
    ];

    const priceUnitOptions = [
        { value: 'bale', label: 'Bale' },
        { value: 'ton', label: 'Ton' },
    ];

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--accent)' }}>Create New Stack</h1>

            <form action={createStack} className="glass-card space-y-5">
                <div>
                    <label className="label-modern">Stack Name / Lot #</label>
                    <input type="text" name="name" required className="input-modern" placeholder="e.g. 2024-ALF-001" />
                </div>

                <div>
                    <label className="label-modern">Commodity</label>
                    <CustomSelect name="commodity" options={commodityOptions} defaultValue="Alfalfa" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-modern">Bale Size</label>
                        <CustomSelect
                            name="baleSize"
                            options={baleSizeOptions}
                            value={baleSize}
                            onChange={handleBaleSizeChange}
                        />
                    </div>
                    <div>
                        <label className="label-modern">Weight/Bale (lbs)</label>
                        <input
                            type="number"
                            name="weightPerBale"
                            className="input-modern"
                            value={weightPerBale}
                            onChange={(e) => setWeightPerBale(parseInt(e.target.value) || 0)}
                            min="1"
                        />
                    </div>
                </div>

                <div>
                    <label className="label-modern">Quality</label>
                    <CustomSelect name="quality" options={qualityOptions} defaultValue="Premium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-modern">Base Price ($)</label>
                        <input type="number" name="basePrice" step="0.01" className="input-modern" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="label-modern">Price Per</label>
                        <CustomSelect
                            name="priceUnit"
                            options={priceUnitOptions}
                            value={priceUnit}
                            onChange={(val) => setPriceUnit(val as 'bale' | 'ton')}
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4">
                    Create Product
                </button>
            </form>
        </div>
    );
}
