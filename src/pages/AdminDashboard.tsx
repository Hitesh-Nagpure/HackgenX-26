import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CATEGORIES, PRIORITY_CONFIG, STATUS_CONFIG } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MapPin, Clock, BarChart3, AlertTriangle, CheckCircle, Loader2,
  Trash2, Trash, User, AlertOctagon, LayoutDashboard, Database, Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ComplaintStatus, ComplaintPriority } from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";


const CHART_COLORS = [
  "hsl(168, 80%, 28%)",
  "hsl(38, 92%, 50%)",
  "hsl(210, 90%, 52%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 69%, 31%)",
  "hsl(280, 60%, 50%)",
];

interface DbComplaint {
  id: string;
  user_id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  location_address: string | null;
  image_url: string | null;
  video_url: string | null;
  media_urls: string[] | null;
  completed_image_url: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<DbComplaint[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading complaints", description: error.message, variant: "destructive" });
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  const fetchWorkers = async () => {
    // First get worker IDs from user_roles
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "worker");

    if (roleError) {
      console.error("Error fetching worker roles:", roleError);
      return;
    }

    if (roleData && roleData.length > 0) {
      const workerIds = roleData.map(r => r.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", workerIds);

      if (profileError) {
        toast({ title: "Error loading workers", description: profileError.message, variant: "destructive" });
      } else {
        setWorkers(profileData || []);
      }
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchWorkers();

    // Listen for Smart Bin Alerts
    const binSubscription = supabase
      .channel('bin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bin_alerts' },
        (payload) => {
          console.log('New bin alert received!', payload);

          // Play disastrous emergency siren
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/952/952-preview.mp3');
          audio.loop = true;
          audio.play().catch(e => console.error("Error playing sound:", e));

          // Stop sound after 5 seconds as requested
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 5000);

          // Show Toast
          toast({
            title: "🚨 DISASTER ALERT: BIN FULL!",
            description: `Bin ${payload.new.bin_id} at ${payload.new.location} is OVERFLOWING! Immediate action required.`,
            variant: "destructive",
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(binSubscription);
    };
  }, []);

  // Alert Admins about unassigned high priority complaints automatically 
  useEffect(() => {
    if (complaints.length > 0) {
      const urgentUnassigned = complaints.filter(
        c => c.priority === "high" && !c.assigned_to && c.status === "pending"
      );

      if (urgentUnassigned.length > 0) {
        // Show a more persistent urgent notification
        toast({
          title: "🚨 URGENT: High Priority Tasks",
          description: `There ${urgentUnassigned.length === 1 ? 'is' : 'are'} ${urgentUnassigned.length} unassigned HIGH PRIORITY emergency ${urgentUnassigned.length === 1 ? 'complaint' : 'complaints'}. Please assign workers immediately.`,
          variant: "destructive",
          duration: 15000, // 15 seconds
        });
      }
    }
  }, [complaints.length]); // Dependency on complaints length or load to re-trigger if new ones come in

  const categoryData = CATEGORIES.map((cat) => ({
    name: cat.label,
    count: complaints.filter((c) => c.category === cat.value).length,
  }));

  const statusData = [
    { name: "Pending", value: complaints.filter((c) => c.status === "pending").length },
    { name: "Processing", value: complaints.filter((c) => c.status === "in_progress").length },
    { name: "Waiting", value: complaints.filter((c) => c.status === "waiting_approval").length },
    { name: "Done", value: complaints.filter((c) => c.status === "resolved").length },
  ];

  const priorityCounts = {
    high: complaints.filter((c) => c.priority === "high").length,
    medium: complaints.filter((c) => c.priority === "medium").length,
    low: complaints.filter((c) => c.priority === "low").length,
  };

  const filtered = complaints.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    return true;
  });

  const updateStatus = async (id: string, newStatus: ComplaintStatus) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Status Update Error:", error);
      let msg = error.message;
      if (msg.includes("column") || msg.includes("schema cache")) {
        msg = "Database Error: Missing columns or outdated schema index. Please run the SQL migration and reload schema in Supabase.";
      }
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `Complaint → ${STATUS_CONFIG[newStatus].label}` });
      fetchComplaints();
    }
  };

  const reassignTask = async (id: string) => {
    // When reassigning, we move it back to in_progress so the worker can try again
    const { error } = await supabase
      .from("complaints")
      .update({
        status: "in_progress",
        completed_image_url: null // Clear previous proof if rejected
      })
      .eq("id", id);

    if (error) {
      console.error("Reassign Error:", error);
      let msg = error.message;
      if (msg.includes("column") || msg.includes("schema cache")) {
        msg = "Database Error: Missing columns or outdated schema index. Please run the SQL migration and reload schema in Supabase.";
      }
      toast({ title: "Reassignment failed", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Task Reassigned", description: "The worker has been notified to re-do the task." });
      fetchComplaints();
    }
  };

  const updatePriority = async (id: string, newPriority: ComplaintPriority) => {
    const { error } = await supabase
      .from("complaints")
      .update({ priority: newPriority })
      .eq("id", id);

    if (error) {
      console.error("Priority Update Error:", error);
      let msg = error.message;
      if (msg.includes("column") || msg.includes("schema cache")) {
        msg = "Database Error: Missing columns or outdated schema index. Please run the SQL migration and reload schema in Supabase.";
      }
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Priority Updated", description: `Priority → ${newPriority.toUpperCase()}` });
      fetchComplaints();
    }
  };

  const assignWorker = async (complaintId: string, workerId: string) => {
    setAssigning(complaintId);
    const { error } = await supabase
      .from("complaints")
      .update({ assigned_to: workerId, status: "in_progress" })
      .eq("id", complaintId);

    setAssigning(null);
    if (error) {
      console.error("Assign Error:", error);
      let msg = error.message;
      if (msg.includes("column") || msg.includes("schema cache")) {
        msg = "Database Error: Missing columns or outdated schema index. Please run the SQL migration and reload schema in Supabase.";
      }
      toast({ title: "Assignment failed", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Worker Assigned", description: "Task has been assigned and moved to processing." });
      fetchComplaints();
    }
  };

  const deleteComplaint = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", id);

    setDeleting(null);
    if (error) {
      console.error("Delete Error:", error);
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task Deleted", description: "The completed task has been removed." });
      fetchComplaints();
    }
  };

  const getWorkerName = (id: string | null) => {
    if (!id) return "Unassigned";
    return workers.find(w => w.id === id)?.full_name || "Unknown Worker";
  };

  const getCategoryLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const getCategoryIcon = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.icon ?? "📋";

  const pendingApprovals = complaints.filter(c => c.status === "waiting_approval");

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
        className="mb-8 p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <img src="/Nagar_Niti_Logo.png" alt="Nagar Niti Logo" className="h-48 w-48 object-contain" />
        </div>
        <div className="relative z-10">
          <Badge className="mb-4 bg-primary text-primary-foreground border-none">Administrator Access</Badge>
          <h1 className="font-display text-4xl font-black text-white">NagarNiti Central Control</h1>
          <p className="mt-3 text-slate-300 max-w-xl text-lg">
            Manage city-wide grievances, oversee worker assignments, and analyze urban trends through your command center.
          </p>
        </div>
      </motion.div>


      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Complaints", value: complaints.length, icon: BarChart3, color: "text-primary" },
          { label: "High Priority", value: priorityCounts.high, icon: AlertTriangle, color: "text-destructive" },
          { label: "Waiting Approval", value: statusData[2].value, icon: Loader2, color: "text-amber-600" },
          { label: "Done", value: statusData[3].value, icon: CheckCircle, color: "text-success" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-card-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending Reviews Section - Very Proactive */}
      {pendingApprovals.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-xl font-bold text-foreground">Requires Your Approval ({pendingApprovals.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((complaint) => (
              <Card key={complaint.id} className="border-amber-200 bg-amber-50/30 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-2">Pending Review</Badge>
                      <h3 className="font-bold text-lg">{getCategoryLabel(complaint.category)}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{complaint.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Assigned To</p>
                      <p className="text-sm font-medium">{getWorkerName(complaint.assigned_to)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Original Issue</p>
                      {complaint.image_url ? (
                        <img src={complaint.image_url} className="h-24 w-full object-cover rounded border" alt="Problem" />
                      ) : (
                        <div className="h-24 w-full bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground italic">No original image</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-success">Worker's Proof</p>
                      {complaint.completed_image_url ? (
                        <img src={complaint.completed_image_url} className="h-24 w-full object-cover rounded border-2 border-success" alt="Resolved proof" />
                      ) : (
                        <div className="h-24 w-full bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground italic">No completion image</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => updateStatus(complaint.id, "resolved")}
                    >
                      Approve & Mark Done
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => reassignTask(complaint.id)}
                    >
                      Reject & Reassign
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold text-card-foreground">Complaints by Category</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(168, 80%, 28%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold text-card-foreground">Status Distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="font-display text-xl font-bold text-foreground">All Complaints</h2>
          <div className="ml-auto flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">Processing</SelectItem>
                <SelectItem value="waiting_approval">Waiting Approval</SelectItem>
                <SelectItem value="resolved">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No complaints found.</p>
          )}
          {filtered.map((complaint, i) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{complaint.id.slice(0, 8)}</span>
                      <Select
                        value={complaint.priority}
                        onValueChange={(val) => updatePriority(complaint.id, val as ComplaintPriority)}
                      >
                        <SelectTrigger className={`h-6 w-24 text-[10px] uppercase font-bold ${PRIORITY_CONFIG[complaint.priority as ComplaintPriority].className}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {complaint.location_address && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {complaint.location_address}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Assigned To</p>
                      <Select
                        disabled={complaint.status === "resolved" || assigning === complaint.id}
                        value={complaint.assigned_to || "unassigned"}
                        onValueChange={(val) => val !== "unassigned" && assignWorker(complaint.id, val)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={workers.find(w => w.id === complaint.assigned_to)?.avatar_url || ""} />
                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                              </Avatar>
                              <span className="truncate">{getWorkerName(complaint.assigned_to)}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {workers.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              <div className="flex items-center gap-2">
                                {worker.full_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {complaint.status === "pending" && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatus(complaint.id, "in_progress")}>Mark Processing</Button>
                      )}
                      {complaint.status === "waiting_approval" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90 flex-1"
                            onClick={() => updateStatus(complaint.id, "resolved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => reassignTask(complaint.id)}
                          >
                            Reassign
                          </Button>
                        </>
                      )}
                      {complaint.status === "in_progress" && (
                        <p className="text-[10px] text-muted-foreground w-full text-center italic">Waiting for worker completion...</p>
                      )}
                      {complaint.status === "resolved" && (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-center py-1 w-full text-xs font-semibold text-success bg-success/10 rounded-md">
                            ✓ Completed & Approved
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full flex items-center gap-2"
                            disabled={deleting === complaint.id}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this completed task? This action cannot be undone.")) {
                                deleteComplaint(complaint.id);
                              }
                            }}
                          >
                            {deleting === complaint.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            {deleting === complaint.id ? "Deleting..." : "Delete Task"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media evidence section */}
                <div className="flex flex-wrap gap-4 border-t border-border pt-4">
                  {complaint.image_url && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Original Photo</p>
                      <img src={complaint.image_url} alt="Original" className="h-32 w-32 object-cover rounded-md border border-border" />
                    </div>
                  )}
                  {complaint.video_url && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Video Evidence</p>
                      <video src={complaint.video_url} controls className="h-32 w-48 object-cover rounded-md border border-border" />
                    </div>
                  )}
                  {complaint.completed_image_url && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-success">Worker's Completion Photo</p>
                      <img src={complaint.completed_image_url} alt="Completion" className="h-32 w-32 object-cover rounded-md border-2 border-success" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;
