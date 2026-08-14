import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { setAdminPassword } from "@/server/admin-setup";

export const Route = createFileRoute("/admin-setup")({
  component: AdminSetup,
  head: () => ({ meta: [{ title: "Admin Setup | Ameer Expo 2026" }] }),
});

function AdminSetup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await setAdminPassword({ data: { email, password, pin } });
      if (!res.success) {
        const err = (res as any).error;
        if (err === "invalid_pin") setMessage("Incorrect setup PIN.");
        else if (err === "already_used") setMessage("Admin setup has already been completed.");
        else if (err === "rate_limited") setMessage("Too many attempts. Try again later.");
        else if (err === "user_not_found") setMessage("No account found for that email.");
        else setMessage("Failed to set password. Check server logs.");
      } else {
        setMessage("Password set successfully. You may now sign in at /admin-login.");
      }
    } catch (err) {
      setMessage("Request failed. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center">
      <main className="w-full max-w-md p-6 bg-card rounded-3xl border border-border/60 shadow-elegant">
        <h1 className="text-2xl font-bold mb-4">Admin Setup (one-time)</h1>
        {message && <div className="text-sm text-muted-foreground mb-3">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm mb-1 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Setup PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold"
              disabled={loading}
            >
              {loading ? "Setting…" : "Set Password"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminSetup;
