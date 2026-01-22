'use server';

import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitTransaction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const type = formData.get('type') as string;
    const stackId = formData.get('stackId');
    const locationId = formData.get('locationId');
    const amount = formData.get('amount');
    const unit = formData.get('unit') || 'bales';
    const entity = formData.get('entity');
    const price = formData.get('price');

    if (!stackId || !amount || !type) {
        throw new Error("Missing required fields");
    }

    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO transactions (type, stack_id, location_id, amount, unit, entity, price, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            type,
            stackId,
            locationId === 'none' ? null : locationId,
            parseFloat(amount as string),
            unit,
            entity,
            price ? parseFloat(price as string) : 0,
            session.user.id
        ]);
    } catch (e) {
        console.error(e);
        throw new Error("Failed to submit transaction");
    } finally {
        client.release();
    }

    revalidatePath('/');
    revalidatePath('/inventory');
    revalidatePath('/log');
}
