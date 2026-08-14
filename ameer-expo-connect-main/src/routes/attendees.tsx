import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/expo/Navbar";
import { Footer } from "@/components/expo/Footer";
import {
  Search,
  Briefcase,
  Handshake,
  CheckCircle2,
  MessageCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/attendees")({
  component: Attendees,
  head: () => ({
    meta: [
      { title: "Networking & Matchmaking | Ameer Expo 2026" },
      {
        name: "description",
        content:
          "Connect with other attendees, exhibitors, and sponsors at Ameer Expo Africa & Middle East.",
      },
    ],
  }),
});

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  industry: string;
  bio: string;
  is_public: boolean;
};

function Attendees() {
  const [attendees, setAttendees] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company: "",
    job_title: "",
    industry: "",
    bio: "",
    is_public: false,
  });

  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      try {
        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (profile) {
            setMyProfile(profile);
            setEditForm({
              company: profile.company || "",
              job_title: profile.job_title || "",
              industry: profile.industry || "",
              bio: profile.bio || "",
              is_public: profile.is_public || false,
            });
          }

          const { data: myConns } = await supabase
            .from("connections")
            .select("*")
            .or(`requester_id.eq.${currentUser.id},target_id.eq.${currentUser.id}`);

          if (myConns) setConnections(myConns);
        }

        const { data: publicProfiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_public", true)
          .neq("id", currentUser?.id || "00000000-0000-0000-0000-000000000000");

        if (publicProfiles) {
          setAttendees(publicProfiles);
        }
      } catch (err) {
        console.error("Failed to load attendees from DB", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company: editForm.company,
          job_title: editForm.job_title,
          industry: editForm.industry,
          bio: editForm.bio,
          is_public: editForm.is_public,
        })
        .eq("id", user.id);

      if (error) throw error;
      setMyProfile({ ...myProfile!, ...editForm });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const requestConnection = async (targetId: string) => {
    if (!user) return alert("Please log in to connect.");
    try {
      const { data, error } = await supabase
        .from("connections")
        .insert({
          requester_id: user.id,
          target_id: targetId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      setConnections([...connections, data]);
      alert("Connection request sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to send request. You might have already sent one.");
    }
  };

  const getConnectionStatus = (targetId: string) => {
    if (!user) return null;
    const conn = connections.find(
      (c) =>
        (c.requester_id === user.id && c.target_id === targetId) ||
        (c.target_id === user.id && c.requester_id === targetId),
    );
    if (!conn) return null;
    return { status: conn.status, isRequester: conn.requester_id === user.id };
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.company?.toLowerCase().includes(search.toLowerCase()) ||
      a.industry?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[120px] pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl font-bold">Attendee Matchmaking</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Connect with industry leaders, exhibitors, and potential partners before the event
              begins.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - My Profile */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-3xl border border-border/60 shadow-elegant p-6 sticky top-[100px]">
                <h2 className="font-bold text-xl mb-4 font-display">My Networking Profile</h2>

                {!user ? (
                  <div className="text-sm text-muted-foreground">
                    Please log in or register to join the networking directory.
                  </div>
                ) : isEditing ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Make profile public
                      </label>
                      <input
                        type="checkbox"
                        checked={editForm.is_public}
                        onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                        className="rounded text-primary"
                      />
                      <span className="ml-2 text-xs text-muted-foreground">
                        Allow others to find and message me
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Company</label>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Job Title</label>
                      <input
                        type="text"
                        value={editForm.job_title}
                        onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                        className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Industry</label>
                      <input
                        type="text"
                        value={editForm.industry}
                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Networking Goals / Bio
                      </label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full rounded-lg border bg-secondary/50 px-3 py-2 outline-none focus:border-primary min-h-[80px]"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveProfile}
                        className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-secondary text-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${myProfile?.is_public ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      <span className="text-sm font-semibold">
                        {myProfile?.is_public ? "Publicly Visible" : "Hidden"}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        Company & Role
                      </div>
                      <div className="text-sm">
                        {myProfile?.job_title} @ {myProfile?.company}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        Industry
                      </div>
                      <div className="text-sm">{myProfile?.industry || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        Bio
                      </div>
                      <div className="text-sm leading-relaxed">
                        {myProfile?.bio || "No bio added."}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full border border-border text-foreground hover:bg-secondary py-2 rounded-lg font-semibold transition-colors text-sm"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Area - Directory */}
            <div className="lg:col-span-3">
              <div className="relative mb-6">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search attendees by name, company, or industry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-border/60 shadow-sm bg-card pl-12 pr-4 py-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
                />
              </div>

              {loading ? (
                <div className="py-20 text-center text-muted-foreground">Loading attendees...</div>
              ) : filteredAttendees.length === 0 ? (
                <div className="py-20 text-center bg-card rounded-3xl border border-border/60 border-dashed">
                  <h3 className="font-semibold text-lg">No attendees found</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Try adjusting your search terms.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredAttendees.map((attendee) => {
                    const conn = getConnectionStatus(attendee.id);
                    return (
                      <div
                        key={attendee.id}
                        className="bg-card rounded-2xl border border-border/60 shadow-sm p-5 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg font-display">
                              {attendee.first_name} {attendee.last_name}
                            </h3>
                            <div className="text-sm text-primary font-medium flex items-center gap-1.5 mt-0.5">
                              <Briefcase size={14} />
                              {attendee.job_title} @ {attendee.company}
                            </div>
                          </div>
                        </div>

                        <div className="inline-block px-2.5 py-1 bg-secondary text-foreground text-xs font-semibold rounded-md mb-3">
                          {attendee.industry}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3 mb-5 min-h-[60px]">
                          {attendee.bio || "Looking forward to connecting at Ameer Expo!"}
                        </p>

                        <div className="pt-4 border-t border-border/60">
                          {!conn ? (
                            <button
                              onClick={() => requestConnection(attendee.id)}
                              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground py-2 rounded-xl font-semibold text-sm transition-colors"
                            >
                              <Handshake size={16} />
                              Connect
                            </button>
                          ) : conn.status === "pending" ? (
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-2 bg-secondary text-muted-foreground py-2 rounded-xl font-semibold text-sm cursor-not-allowed"
                            >
                              <Clock size={16} />
                              Request Pending
                            </button>
                          ) : conn.status === "accepted" ? (
                            <button className="w-full flex items-center justify-center gap-2 bg-green-500/10 text-green-600 py-2 rounded-xl font-semibold text-sm hover:bg-green-500 hover:text-white transition-colors">
                              <MessageCircle size={16} />
                              Message
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-2 rounded-xl font-semibold text-sm cursor-not-allowed"
                            >
                              <XCircle size={16} />
                              Declined
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
