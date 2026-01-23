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

interface Props {
    searchParams: Promise<{ type?: string }>;
}

export default async function LogPage({ searchParams }: Props) {
    const session = await auth();
    if (!session?.user?.id) redirect("/api/auth/signin");

    const resolvedSearchParams = await searchParams;
    const type = resolvedSearchParams.type;

    const data = await getData(session.user.id);

    // Dynamic Title
    const getTitle = (t?: string) => {
        switch (t) {
            case 'production': return 'Record Production (Bale)';
            case 'sale': return 'Record Sale';
            case 'purchase': return 'Record Purchase';
            case 'adjustment': return 'Record Adjustment';
            default: return 'New Log Entry';
        }
    }

    return (
        <div>
            <h1 className="text-xl font-bold mb-6">{getTitle(type)}</h1>
            <LogForm stacks={data.stacks} locations={data.locations} type={type} />
        </div>
    );
}
