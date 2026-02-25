import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { SAMPLE_COMPLAINTS, CATEGORIES, PRIORITY_CONFIG, STATUS_CONFIG } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, BarChart3, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ComplaintStatus } from "@/data/types";

const CHART_COLORS = [
  "hsl(168, 80%, 28%)",
  "hsl(38, 92%, 50%)",
  "hsl(210, 90%, 52%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 69%, 31%)",
  "hsl(280, 60%, 50%)",
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState(SAMPLE_COMPLAINTS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Analytics data
  const categoryData = CATEGORIES.map((cat) => ({
    name: cat.label,
    count: complaints.filter((c) => c.category === cat.value).length,
  }));

  const statusData = [
    { name: "Pending", value: complaints.filter((c) => c.status === "pending").length },
    { name: "In Progress", value: complaints.filter((c) => c.status === "in_progress").length },
    { name: "Resolved", value: complaints.filter((c) => c.status === "resolved").length },
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

  const updateStatus = (id: string, newStatus: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
    );
    toast({ title: "Status Updated", description: `Complaint ${id} → ${STATUS_CONFIG[newStatus].label}` });
  };

  const getCategoryLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const getCategoryIcon = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.icon ?? "📋";

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Municipal grievance management & analytics</p>
      </motion.div>

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Complaints", value: complaints.length, icon: BarChart3, color: "text-primary" },
          { label: "High Priority", value: priorityCounts.high, icon: AlertTriangle, color: "text-destructive" },
          { label: "In Progress", value: statusData[1].value, icon: Loader2, color: "text-info" },
          { label: "Resolved", value: statusData[2].value, icon: CheckCircle, color: "text-success" },
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

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
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
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((complaint, i) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
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
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {complaint.location.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                    {complaint.assignedTo && <span>Assigned: {complaint.assignedTo}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {complaint.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(complaint.id, "in_progress")}>
                      Start Work
                    </Button>
                  )}
                  {complaint.status === "in_progress" && (
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => updateStatus(complaint.id, "resolved")}>
                      Resolve
                    </Button>
                  )}
                  {complaint.status === "resolved" && (
                    <span className="text-xs text-success">✓ Done</span>
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
