'use client';

import CustomSelect from "@/components/CustomSelect";

interface UnitSelectProps {
    name: string;
    defaultValue?: string;
    options?: { value: string; label: string }[];
}

export default function UnitSelect({ name, defaultValue = 'bales', options }: UnitSelectProps) {
    const defaultOptions = [
        { value: 'bales', label: 'Bales' },
        { value: 'tons', label: 'Tons' },
    ];

    return (
        <CustomSelect
            name={name}
            options={options || defaultOptions}
            defaultValue={defaultValue}
        />
    );
}
