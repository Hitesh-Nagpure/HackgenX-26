import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Camera, CheckCircle2, Loader2, Image as ImageIcon, Activity } from "lucide-react";
import { Complaint, ComplaintPriority, ComplaintStatus } from "@/data/types";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/data/mockData";

const WorkerDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeComplaint, setActiveComplaint] = useState<string | null>(null);

    const fetchAssignedTasks = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("complaints")
            .select("*")
            .eq("assigned_to", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            toast({ title: "Error", description: "Failed to fetch tasks", variant: "destructive" });
        } else {
            setComplaints(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAssignedTasks();
    }, [user]);

    const handleCompleteTask = async (complaintId: string, file: File) => {
        setUpdating(complaintId);
        try {
            const ext = file.name.split(".").pop();
            const filePath = `completions/${complaintId}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("complaint-evidence")
                .upload(filePath, file);

            if (uploadError) {
                console.error("Worker upload error:", uploadError);
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            const { data: urlData } = supabase.storage.from("complaint-evidence").getPublicUrl(filePath);
            const completedImageUrl = urlData.publicUrl;

            // Update status to waiting_approval instead of resolved
            const { error: updateError } = await supabase
                .from("complaints")
                .update({
                    status: "waiting_approval",
                    // Storing the completed image URL for admin review
                    completed_image_url: completedImageUrl
                })
                .eq("id", complaintId);

            if (updateError) throw updateError;

            toast({ title: "Task Submitted", description: "Waiting for admin approval." });
            fetchAssignedTasks();
        } catch (err: any) {
            console.error("Worker Update Error:", err);
            let msg = err.message;
            if (msg.includes("column") || msg.includes("schema cache")) {
                msg = "Database Error: Missing columns or outdated schema. Please run the migration and reload schema in Supabase.";
            }
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setUpdating(null);
            setActiveComplaint(null);
        }
    };

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
                className="mb-8 p-8 rounded-[2rem] bg-emerald-900 text-white relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Activity className="h-48 w-48 text-white" />
                </div>
                <div className="relative z-10">
                    <Badge className="mb-4 bg-emerald-500 text-white border-none">Field Service Portal</Badge>
                    <h1 className="font-display text-4xl font-black text-white">Worker Dashboard</h1>
                    <p className="mt-3 text-emerald-100 max-w-xl text-lg">
                        Stay focused on resolving urban issues and keeping our city harmonious. Your expertise makes the difference.
                    </p>
                </div>
            </motion.div>


            <div className="mt-8 space-y-6">
                {complaints.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium">No tasks assigned</h3>
                        <p className="text-muted-foreground">You're all caught up! New tasks will appear here.</p>
                    </div>
                ) : (
                    complaints.map((complaint) => (
                        <Card key={complaint.id} className="overflow-hidden border-border shadow-card hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-64 h-48 md:h-auto bg-muted flex flex-col">
                                    {complaint.image_url && (
                                        <img
                                            src={complaint.image_url}
                                            alt="Complaint"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    {complaint.video_url && (
                                        <div className="mt-auto p-2 bg-black/80">
                                            <p className="text-[10px] text-white uppercase font-bold mb-1 ml-1">Original Video</p>
                                            <video
                                                src={complaint.video_url}
                                                controls
                                                className="w-full h-24 object-cover rounded shadow"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className={STATUS_CONFIG[complaint.status as ComplaintStatus].className}>
                                            {STATUS_CONFIG[complaint.status as ComplaintStatus].label}
                                        </Badge>
                                        <Badge className={PRIORITY_CONFIG[complaint.priority as ComplaintPriority].className}>
                                            {PRIORITY_CONFIG[complaint.priority as ComplaintPriority].label}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl mb-2">{complaint.category.replace("_", " ")}</CardTitle>
                                    <p className="text-muted-foreground text-sm mb-4">{complaint.description}</p>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {complaint.location_address}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            Assigned on {new Date(complaint.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {(complaint.status === "in_progress" || complaint.status === "waiting_approval") && (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && activeComplaint) handleCompleteTask(activeComplaint, file);
                                                }}
                                            />
                                            <Button
                                                disabled={updating === complaint.id || complaint.status === "waiting_approval"}
                                                onClick={() => {
                                                    setActiveComplaint(complaint.id);
                                                    fileInputRef.current?.click();
                                                }}
                                                className={`w-full md:w-auto gap-2 ${complaint.status === "waiting_approval"
                                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
                                                    : ""
                                                    }`}
                                            >
                                                {updating === complaint.id || complaint.status === "waiting_approval" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Camera className="h-4 w-4" />
                                                )}
                                                {complaint.status === "waiting_approval"
                                                    ? "waiting for approval"
                                                    : "Complete & Upload Photo"}
                                            </Button>
                                        </div>
                                    )}

                                    {complaint.status === "resolved" && (
                                        <div className="flex items-center gap-2 text-success font-medium">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Task Fully Resolved
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkerDashboard;
