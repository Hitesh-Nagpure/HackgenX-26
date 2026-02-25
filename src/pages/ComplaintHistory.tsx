import { motion } from "framer-motion";
import { SAMPLE_COMPLAINTS, CATEGORIES, PRIORITY_CONFIG, STATUS_CONFIG } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";

const ComplaintHistory = () => {
  // Show complaints for "user1" as mock logged-in user
  const userComplaints = SAMPLE_COMPLAINTS;

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const getCategoryIcon = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.icon ?? "📋";

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Complaint History</h1>
        <p className="mt-2 text-muted-foreground">Track all your submitted complaints and their status.</p>
      </motion.div>

      <div className="mt-8 space-y-4">
        {userComplaints.map((complaint, i) => (
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
                  <span className="font-mono text-xs text-muted-foreground">{complaint.id}</span>
                  <Badge className={PRIORITY_CONFIG[complaint.priority].className}>
                    {PRIORITY_CONFIG[complaint.priority].label}
                  </Badge>
                  <Badge className={STATUS_CONFIG[complaint.status].className}>
                    {STATUS_CONFIG[complaint.status].label}
                  </Badge>
                </div>
                <h3 className="mt-2 font-display text-base font-semibold text-card-foreground">
                  {getCategoryIcon(complaint.category)} {getCategoryLabel(complaint.category)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{complaint.description}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {complaint.location.address}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
              {complaint.assignedTo && (
                <span>Assigned: {complaint.assignedTo}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintHistory;
