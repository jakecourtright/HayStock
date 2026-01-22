
import { signIn } from "@/lib/auth";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="glass-card w-full max-w-sm p-8 text-center">
                <h1 className="text-2xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                    Welcome Back
                </h1>
                <p className="text-slate-400 mb-8 text-sm">Sign in to access your inventory</p>

                <form
                    action={async (formData) => {
                        "use server";
                        await signIn("credentials", formData);
                    }}
                    className="space-y-4"
                >
                    <div className="text-left">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 mt-1 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="text-left">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 mt-1 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button className="btn btn-primary w-full mt-4 justify-center">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
