'use client';

import { updateStack } from "@/app/actions";
import { BALE_SIZES, BALE_SIZE_WEIGHTS, getDefaultWeight } from "@/lib/units";
import { useState } from "react";
import CustomSelect from "@/components/CustomSelect";

interface Stack {
    id: number;
    name: string;
    commodity: string;
    bale_size: string;
    quality: string;
    base_price: number;
    weight_per_bale: number | null;
    price_unit: string;
}

interface EditStackFormProps {
    stack: Stack;
}

export default function EditStackForm({ stack }: EditStackFormProps) {
    const [baleSize, setBaleSize] = useState(stack.bale_size || '3x4');
    const [weightPerBale, setWeightPerBale] = useState(
        stack.weight_per_bale || getDefaultWeight(stack.bale_size)
    );
    const [priceUnit, setPriceUnit] = useState<'bale' | 'ton'>(
        (stack.price_unit as 'bale' | 'ton') || 'bale'
    );

    const handleBaleSizeChange = (newSize: string) => {
        setBaleSize(newSize);
        // Only prefill if weight wasn't already customized
        if (!stack.weight_per_bale) {
            setWeightPerBale(BALE_SIZE_WEIGHTS[newSize] || 1200);
        }
    };

    const updateWithId = updateStack.bind(null, stack.id.toString());

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
        <form action={updateWithId} className="glass-card space-y-5">
            <div>
                <label className="label-modern">Lot/Stack Name</label>
                <input
                    type="text"
                    name="name"
                    required
                    defaultValue={stack.name}
                    className="input-modern"
                />
            </div>

            <div>
                <label className="label-modern">Commodity</label>
                <CustomSelect name="commodity" options={commodityOptions} defaultValue={stack.commodity} />
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
                <CustomSelect name="quality" options={qualityOptions} defaultValue={stack.quality} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label-modern">Base Price ($)</label>
                    <input
                        type="number"
                        name="basePrice"
                        step="0.01"
                        defaultValue={stack.base_price}
                        className="input-modern"
                    />
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
                Update Stack
            </button>
        </form>
    );
}
