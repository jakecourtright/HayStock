import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import LogForm from "./LogForm";

async function getData(userId: string) {
    const client = await pool.connect();
    try {
        const stacks = await client.query('SELECT * FROM stacks WHERE user_id = $1 ORDER BY name ASC', [userId]);
        const locations = await client.query('SELECT * FROM locations WHERE user_id = $1 ORDER BY name ASC', [userId]);
        return {
            stacks: stacks.rows,
            locations: locations.rows
        };
    } finally {
        client.release();
    }
}

export default async function LogPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const data = await getData(session.user.id);

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">New Log Entry</h1>
            <LogForm stacks={data.stacks} locations={data.locations} />
        </div>
    );
}
