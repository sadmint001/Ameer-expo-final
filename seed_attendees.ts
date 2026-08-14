import { supabaseAdmin } from "./src/lib/supabase-server";

async function seed() {
  console.log("Seeding mock attendees into DB...");

  const mockUsers = [
    {
      email: "sarah.jenkins@technova.com",
      first_name: "Sarah",
      last_name: "Jenkins",
      company: "TechNova Solutions",
      job_title: "Product Manager",
      industry: "Technology",
      is_public: true,
    },
    {
      email: "ahmed.sayed@globallogistics.com",
      first_name: "Ahmed",
      last_name: "Al-Sayed",
      company: "Global Logistics Ltd",
      job_title: "Director of Operations",
      industry: "Logistics",
      is_public: true,
    },
    {
      email: "grace.o@agrigrow.ke",
      first_name: "Grace",
      last_name: "Odinga",
      company: "AgriGrow Kenya",
      job_title: "CEO",
      industry: "Agriculture",
      is_public: true,
    },
  ];

  for (const u of mockUsers) {
    try {
      // Create user in auth.users (the trigger will create a profile row)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name },
      });

      let userId: string;
      if (createErr) {
        // User may already exist — look them up
        console.log(`Auth user may exist for ${u.email}, looking up...`);
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((usr) => usr.email === u.email);
        if (!existing) {
          console.error(`Could not find or create user for ${u.email}`);
          continue;
        }
        userId = existing.id;
      } else {
        userId = created.user.id;
      }

      // Update profile with networking fields
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          company: u.company,
          job_title: u.job_title,
          industry: u.industry,
          is_public: u.is_public,
        })
        .eq("id", userId);

      if (updateErr) {
        console.error(`Failed to update profile for ${u.first_name}:`, updateErr);
      } else {
        console.log(`✓ Seeded ${u.first_name} ${u.last_name} (${userId})`);
      }
    } catch (err) {
      console.error(`Error seeding ${u.first_name}:`, err);
    }
  }
  console.log("Done.");
}

seed().catch(console.error);
