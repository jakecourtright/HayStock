'use client';

import { deleteLocation } from "@/app/actions";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ locationId }: { locationId: string }) {
    async function handleDelete() {
        if (confirm('Are you sure you want to delete this location? This cannot be undone.')) {
            try {
                await deleteLocation(locationId);
            } catch (error: any) {
                alert(error.message || 'Failed to delete location');
            }
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="w-full p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
            <Trash2 size={16} />
            Delete Location
        </button>
    );
}
