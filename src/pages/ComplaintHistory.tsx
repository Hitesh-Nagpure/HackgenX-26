import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CATEGORIES, PRIORITY_CONFIG, STATUS_CONFIG } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Loader2, History } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { ComplaintPriority, ComplaintStatus } from "@/data/types";

interface DbComplaint {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  location_address: string | null;
  image_url: string | null;
  created_at: string;
  assigned_to: string | null;
}

const ComplaintHistory = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<DbComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setComplaints(data || []);
      setLoading(false);
    };
    fetchComplaints();
  }, [user]);

  const getCategoryLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const getCategoryIcon = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.icon ?? "📋";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-8 rounded-[2rem] bg-primary text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <History className="h-48 w-48 text-white" />
        </div>
        <div className="relative z-10">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Citizen Portal</Badge>
          <h1 className="font-display text-4xl font-black text-white">Your Impact History</h1>
          <p className="mt-3 text-white/80 max-w-xl text-lg">
            Every report you file contributes to a better city. Track the progress of your contributions here.
          </p>
        </div>
      </motion.div>


      {complaints.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-lg">No complaints yet.</p>
          <p className="mt-1 text-sm">File your first complaint to get started!</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {complaints.map((complaint, i) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{complaint.id.slice(0, 8)}</span>
                    {PRIORITY_CONFIG[complaint.priority as ComplaintPriority] && (
                      <Badge className={PRIORITY_CONFIG[complaint.priority as ComplaintPriority].className}>
                        {PRIORITY_CONFIG[complaint.priority as ComplaintPriority].label}
                      </Badge>
                    )}
                    {STATUS_CONFIG[complaint.status as ComplaintStatus] && (
                      <Badge className={STATUS_CONFIG[complaint.status as ComplaintStatus].className}>
                        {STATUS_CONFIG[complaint.status as ComplaintStatus].label}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-card-foreground">
                    {getCategoryIcon(complaint.category)} {getCategoryLabel(complaint.category)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{complaint.description}</p>
                </div>
                {complaint.image_url && (
                  <img src={complaint.image_url} alt="Evidence" className="h-20 w-20 rounded-lg object-cover" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {complaint.location_address && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {complaint.location_address}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(complaint.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintHistory;
