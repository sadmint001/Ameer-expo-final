import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/expo/Navbar";
import { Footer } from "@/components/expo/Footer";
import {
  Users,
  DollarSign,
  Ticket,
  Bell,
  Calendar,
  Activity,
  BarChart,
  Settings,
  Search,
  Plus,
  Trash2,
  Download,
  TrendingUp,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Eye,
  Briefcase,
  CheckCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { confirmBoothBooking } from "@/server/booths";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Ameer Expo 2026" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Registration = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  pass_type: string;
  amount: number;
  payment_status: string;
  created_at: string;
  ticket_number: string | null;
};

type Session = {
  id: string;
  title: string;
  description: string;
  speaker_name: string;
  speaker_role: string;
  start_time: string;
  end_time: string;
  location: string;
  track: string;
};

type Lead = {
  id: string;
  type: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  amount: number | null;
  booth_number: string | null;
  created_at: string;
};

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "registrations" | "sessions" | "notifications" | "leads"
  >("overview");

  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    vipCount: 0,
    generalCount: 0,
    paidCount: 0,
    pendingCount: 0,
    checkedInCount: 0,
  });

  const [partnerStats, setPartnerStats] = useState({
    totalExhibitors: 0,
    totalSponsors: 0,
    totalBoothRevenue: 0,
  });

  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [confirmingBoothId, setConfirmingBoothId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPassType, setFilterPassType] = useState<"all" | "general" | "vip">("all");
  const [sortField, setSortField] = useState<"created_at" | "first_name">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Session form state
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    speaker_name: "",
    speaker_role: "",
    start_time: "",
    end_time: "",
    location: "",
    track: "General",
  });

  // Notification state
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    async function checkAdminAndLoadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If there is no active session, send them straight to the login page.
      if (!session) {
        window.location.replace("/admin-login");
        return;
      }

      // Check if admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .maybeSingle();

      // Check admin flag on profile; deny access if not admin
      if (profile?.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Load all registrations (only after we've confirmed admin access)
        const { data: registrations } = await supabase
          .from("registrations")
          .select(
            "id, first_name, last_name, email, phone, company, pass_type, amount, payment_status, created_at, ticket_number",
          )
          .order("created_at", { ascending: false });

        if (registrations) {
          const revenue = registrations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
          const vip = registrations.filter((r) => r.pass_type === "vip").length;
          const gen = registrations.filter((r) => r.pass_type === "general").length;
          const paid = registrations.filter(
            (r) => r.payment_status === "paid" || r.payment_status === "free",
          ).length;
          const pending = registrations.filter((r) => r.payment_status === "pending").length;

          setStats({
            totalRegistrations: registrations.length,
            totalRevenue: revenue,
            vipCount: vip,
            generalCount: gen,
            paidCount: paid,
            pendingCount: pending,
            checkedInCount: 0,
          });

          setAllRegistrations(registrations as Registration[]);
        }

        // Load sessions
        const { data: sessionsData } = await supabase
          .from("sessions")
          .select("*")
          .order("start_time", { ascending: true });

        if (sessionsData) {
          setSessions(sessionsData as Session[]);
        }

        // Load partner inquiry leads
        const { data: leadsData } = await supabase
          .from("partner_inquiries")
          .select(
            "id, type, company_name, contact_name, email, phone, message, amount, booth_number, created_at",
          )
          .order("created_at", { ascending: false });

        if (leadsData) {
          const exhibitors = leadsData.filter((l) => l.type === "exhibitor").length;
          const sponsors = leadsData.filter((l) => l.type === "sponsor").length;
          const revenue = leadsData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

          setPartnerStats({
            totalExhibitors: exhibitors,
            totalSponsors: sponsors,
            totalBoothRevenue: revenue,
          });

          setLeads(leadsData as Lead[]);
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndLoadData();
  }, []);

  // Filtered + sorted registrations
  const filteredRegistrations = useMemo(() => {
    let list = [...allRegistrations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.first_name?.toLowerCase().includes(q) ||
          r.last_name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.company?.toLowerCase().includes(q) ||
          r.ticket_number?.toLowerCase().includes(q),
      );
    }

    if (filterPassType !== "all") {
      list = list.filter((r) => r.pass_type === filterPassType);
    }

    list.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return list;
  }, [allRegistrations, searchQuery, filterPassType, sortField, sortDir]);

  const toggleSort = (field: "created_at" | "first_name") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle || !notificationMessage) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await supabase.from("announcements").insert({
        title: notificationTitle,
        message: notificationMessage,
        created_by: session?.user?.id,
      });

      if (error) throw error;

      alert("Announcement sent successfully!");
      setNotificationTitle("");
      setNotificationMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to send announcement.");
    }
  };

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("sessions").insert({
        title: sessionForm.title,
        description: sessionForm.description,
        speaker_name: sessionForm.speaker_name,
        speaker_role: sessionForm.speaker_role,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        location: sessionForm.location,
        track: sessionForm.track,
      });

      if (error) throw error;

      // Refresh sessions
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("start_time", { ascending: true });
      if (data) setSessions(data as Session[]);

      setSessionForm({
        title: "",
        description: "",
        speaker_name: "",
        speaker_role: "",
        start_time: "",
        end_time: "",
        location: "",
        track: "General",
      });
      setShowSessionForm(false);
      alert("Session added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add session.");
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete session.");
    }
  };

  const exportRegistrationsCsv = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Pass Type",
      "Amount",
      "Payment Status",
      "Ticket #",
      "Date",
    ];
    const rows = filteredRegistrations.map((r) => [
      `${r.first_name} ${r.last_name}`,
      r.email,
      r.phone || "",
      r.company || "",
      r.pass_type,
      r.amount,
      r.payment_status,
      r.ticket_number || "",
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/40 flex flex-col items-center justify-center">
        <Activity className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-secondary/40 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-[120px] pb-24 flex items-center justify-center">
          <div className="bg-card p-8 rounded-3xl border border-red-500/20 text-center shadow-sm max-w-md">
            <Settings className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
            <h1 className="text-2xl font-bold font-display text-red-500 mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You do not have administrator privileges to view this page. Please sign in with an
              admin account.
            </p>
            <a
              href="/admin-login"
              className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Go to Sign In
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: BarChart },
    {
      key: "registrations" as const,
      label: "Registrations",
      icon: Users,
    },
    { key: "sessions" as const, label: "Sessions", icon: Calendar },
    {
      key: "notifications" as const,
      label: "Notifications",
      icon: Bell,
    },
    { key: "leads" as const, label: "Leads", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[120px] pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage registrations, sessions, and view event analytics.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-8 bg-card rounded-2xl border border-border/60 p-1.5 shadow-soft overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">
                      Total Attendees
                    </div>
                    <div className="text-3xl font-bold font-display">
                      {stats.totalRegistrations}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">
                      Total Revenue
                    </div>
                    <div className="text-3xl font-bold font-display">
                      KES{" "}
                      {stats.totalRevenue.toLocaleString("en-KE", {
                        minimumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#bf953f]/10 text-[#bf953f] flex items-center justify-center shrink-0">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">VIP Passes</div>
                    <div className="text-3xl font-bold font-display">{stats.vipCount}</div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">
                      General Passes
                    </div>
                    <div className="text-3xl font-bold font-display">{stats.generalCount}</div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">
                      Total Exhibitors
                    </div>
                    <div className="text-3xl font-bold font-display">
                      {partnerStats.totalExhibitors}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">
                      Total Sponsors
                    </div>
                    <div className="text-3xl font-bold font-display">
                      {partnerStats.totalSponsors}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-elegant flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <BarChart size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">
                      Total Booth Revenue
                    </div>
                    <div className="text-3xl font-bold font-display">
                      KES{" "}
                      {partnerStats.totalBoothRevenue.toLocaleString("en-KE", {
                        minimumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border/60 p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                    <Eye size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Confirmed
                    </div>
                    <div className="text-xl font-bold">{stats.paidCount}</div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border/60 p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Pending Payment
                    </div>
                    <div className="text-xl font-bold">{stats.pendingCount}</div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border/60 p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Sessions Planned
                    </div>
                    <div className="text-xl font-bold">{sessions.length}</div>
                  </div>
                </div>
              </div>

              {/* Recent Registrations Preview */}
              <div className="bg-card rounded-3xl border border-border/60 shadow-elegant overflow-hidden">
                <div className="p-6 border-b border-border/60 flex items-center justify-between">
                  <h2 className="font-bold text-xl font-display flex items-center gap-2">
                    <Activity size={20} className="text-primary" />
                    Recent Registrations
                  </h2>
                  <button
                    onClick={() => setActiveTab("registrations")}
                    className="text-sm text-primary font-semibold hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Company</th>
                        <th className="px-6 py-4 font-semibold">Pass Type</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {allRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                            No registrations yet.
                          </td>
                        </tr>
                      ) : (
                        allRegistrations.slice(0, 5).map((reg) => (
                          <tr key={reg.id} className="hover:bg-accent/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-foreground">
                                {reg.first_name} {reg.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">{reg.email}</div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {reg.company || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                  reg.pass_type === "vip"
                                    ? "bg-[#bf953f]/10 text-[#bf953f]"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {reg.pass_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                  reg.payment_status === "free" || reg.payment_status === "paid"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {reg.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {new Date(reg.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTRATIONS TAB ── */}
          {activeTab === "registrations" && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-soft flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, email, company, or ticket #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={filterPassType}
                    onChange={(e) => setFilterPassType(e.target.value as "all" | "general" | "vip")}
                    className="rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="all">All Passes</option>
                    <option value="general">General</option>
                    <option value="vip">VIP</option>
                  </select>
                  <button
                    onClick={exportRegistrationsCsv}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Count Badge */}
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filteredRegistrations.length}
                </span>{" "}
                of <span className="font-semibold text-foreground">{allRegistrations.length}</span>{" "}
                registrations
              </div>

              {/* Table */}
              <div className="bg-card rounded-3xl border border-border/60 shadow-elegant overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th
                          className="px-6 py-4 font-semibold cursor-pointer select-none"
                          onClick={() => toggleSort("first_name")}
                        >
                          <span className="flex items-center gap-1">
                            Name
                            {sortField === "first_name" &&
                              (sortDir === "asc" ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              ))}
                          </span>
                        </th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Company</th>
                        <th className="px-6 py-4 font-semibold">Pass</th>
                        <th className="px-6 py-4 font-semibold">Amount</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Ticket #</th>
                        <th
                          className="px-6 py-4 font-semibold cursor-pointer select-none"
                          onClick={() => toggleSort("created_at")}
                        >
                          <span className="flex items-center gap-1">
                            Date
                            {sortField === "created_at" &&
                              (sortDir === "asc" ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              ))}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                            {searchQuery
                              ? "No registrations match your search."
                              : "No registrations found."}
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-accent/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                              {reg.first_name} {reg.last_name}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{reg.email}</td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {reg.company || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                  reg.pass_type === "vip"
                                    ? "bg-[#bf953f]/10 text-[#bf953f]"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {reg.pass_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-foreground">
                              {Number(reg.amount) > 0
                                ? `KES ${Number(reg.amount).toLocaleString("en-KE")}`
                                : "Free"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                  reg.payment_status === "free" || reg.payment_status === "paid"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {reg.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                              {reg.ticket_number || "-"}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {new Date(reg.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SESSIONS TAB ── */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-2xl font-display">Session Management</h2>
                <button
                  onClick={() => setShowSessionForm(!showSessionForm)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-glow"
                >
                  <Plus size={16} />
                  Add Session
                </button>
              </div>

              {/* Add Session Form */}
              {showSessionForm && (
                <form
                  onSubmit={addSession}
                  className="bg-card rounded-3xl border border-border/60 shadow-elegant p-6 space-y-4"
                >
                  <h3 className="font-bold text-lg font-display">New Session</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      required
                      type="text"
                      placeholder="Session Title"
                      value={sessionForm.title}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          title: e.target.value,
                        })
                      }
                      className="rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Speaker Name"
                      value={sessionForm.speaker_name}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          speaker_name: e.target.value,
                        })
                      }
                      className="rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Speaker Role / Title"
                      value={sessionForm.speaker_role}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          speaker_role: e.target.value,
                        })
                      }
                      className="rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Location (e.g. Hall A)"
                      value={sessionForm.location}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          location: e.target.value,
                        })
                      }
                      className="rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
                      <input
                        required
                        type="datetime-local"
                        value={sessionForm.start_time}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            start_time: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">End Time</label>
                      <input
                        required
                        type="datetime-local"
                        value={sessionForm.end_time}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            end_time: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <select
                      value={sessionForm.track}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          track: e.target.value,
                        })
                      }
                      className="rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      <option>General</option>
                      <option>Technology</option>
                      <option>Business</option>
                      <option>Innovation</option>
                      <option>Trade</option>
                      <option>Investment</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Session description..."
                    value={sessionForm.description}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary min-h-[80px]"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      Save Session
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSessionForm(false)}
                      className="px-6 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Sessions List */}
              {sessions.length === 0 ? (
                <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-12 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Sessions Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Click "Add Session" above to create your first agenda item.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 flex items-start gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-foreground text-base">{session.title}</h3>
                            {session.speaker_name && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {session.speaker_name}
                                {session.speaker_role && ` · ${session.speaker_role}`}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                            title="Delete session"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {session.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(session.start_time).toLocaleString("en-KE", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {new Date(session.end_time).toLocaleTimeString("en-KE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {session.location}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                            {session.track}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === "notifications" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-6">
                <h2 className="font-bold text-xl font-display mb-2 flex items-center gap-2">
                  <Bell size={20} className="text-primary" />
                  Broadcast Announcement
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Send a global announcement to all attendees' dashboards and mobile apps.
                  Announcements appear in real-time via Supabase Realtime.
                </p>
                <form onSubmit={sendNotification} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hall B is now open"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1.5">
                      Message
                    </label>
                    <textarea
                      placeholder="Type the announcement message..."
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary min-h-[120px]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-glow text-sm"
                  >
                    🔔 Broadcast Message
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── LEADS TAB ── */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl font-display flex items-center gap-2">
                    <Briefcase size={22} className="text-primary" />
                    Partner Leads
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Exhibitor and sponsor inquiries captured via the website.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                  {leads.length} total
                </span>
              </div>

              {/* Search bar */}
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-soft">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search by company, name, or email…"
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-card rounded-3xl border border-border/60 shadow-elegant overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Company</th>
                        <th className="px-6 py-4 font-semibold">Contact</th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Interest</th>
                        <th className="px-6 py-4 font-semibold">Booth</th>
                        <th className="px-6 py-4 font-semibold">Message</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {leads
                        .filter((l) => {
                          if (!leadsSearch.trim()) return true;
                          const q = leadsSearch.toLowerCase();
                          return (
                            l.company_name?.toLowerCase().includes(q) ||
                            l.contact_name?.toLowerCase().includes(q) ||
                            l.email?.toLowerCase().includes(q)
                          );
                        })
                        .map((lead) => (
                          <tr key={lead.id} className="hover:bg-accent/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                              {lead.company_name}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {lead.contact_name}
                              {lead.phone && (
                                <div className="text-xs text-muted-foreground/70">{lead.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{lead.email}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                  lead.type === "sponsor"
                                    ? "bg-[#bf953f]/10 text-[#bf953f]"
                                    : "bg-blue-500/10 text-blue-600"
                                }`}
                              >
                                {lead.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {lead.booth_number ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/10 text-orange-600">
                                  <MapPin size={11} /> #{lead.booth_number}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground max-w-xs">
                              <p className="line-clamp-2 text-xs">
                                {lead.message || <span className="italic opacity-50">—</span>}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              {lead.booth_number ? (
                                <button
                                  disabled={confirmingBoothId === lead.id}
                                  onClick={async () => {
                                    if (!lead.booth_number) return;
                                    setConfirmingBoothId(lead.id);
                                    try {
                                      const res = await confirmBoothBooking({
                                        data: {
                                          inquiryId: lead.id,
                                          boothNumber: lead.booth_number,
                                        },
                                      });
                                      if (res.success) {
                                        alert(`Booth #${lead.booth_number} marked as BOOKED.`);
                                      } else {
                                        alert(res.error || "Failed to confirm booking.");
                                      }
                                    } finally {
                                      setConfirmingBoothId(null);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  <CheckCheck size={13} />
                                  {confirmingBoothId === lead.id
                                    ? "Confirming…"
                                    : "Confirm Booking"}
                                </button>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs italic">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {leads.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            No partner inquiries yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
