import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, TrendingUp, UserX, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORIES } from "@/data/mockData";

interface PendingComplaint {
    id: string;
    category: string;
    description: string;
    location_address: string;
    created_at: string;
    assigned_to: string | null;
    worker_name?: string;
    worker_avatar?: string;
}

const Billboard = () => {
    const [complaints, setComplaints] = useState<PendingComplaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingData();
    }, []);

    const getAuthorityDetails = (category: string) => {
        switch (category) {
            case 'waste_management':
                return { name: "Waste Management Authority", image: "https://api.dicebear.com/8.x/initials/svg?seed=WM&backgroundColor=ef4444" };
            case 'water_supply':
                return { name: "Water Supply Board", image: "https://api.dicebear.com/8.x/initials/svg?seed=WS&backgroundColor=ef4444" };
            case 'road_potholes':
                return { name: "Public Works Department", image: "https://api.dicebear.com/8.x/initials/svg?seed=PW&backgroundColor=ef4444" };
            case 'streetlight':
                return { name: "Electricity Board", image: "https://api.dicebear.com/8.x/initials/svg?seed=EB&backgroundColor=ef4444" };
            case 'drainage':
                return { name: "Drainage & Sewage Dept", image: "https://api.dicebear.com/8.x/initials/svg?seed=DS&backgroundColor=ef4444" };
            case 'sanitation':
                return { name: "Sanitation Department", image: "https://api.dicebear.com/8.x/initials/svg?seed=SD&backgroundColor=ef4444" };
            default:
                return { name: "Municipal Corporation", image: "https://api.dicebear.com/8.x/initials/svg?seed=MC&backgroundColor=ef4444" };
        }
    };

    const fetchPendingData = async () => {
        try {
            // Fetch only unresolved tasks
            const { data: complaintsData, error: complaintsError } = await supabase
                .from("complaints")
                .select(`
          id, category, description, location_address, created_at, assigned_to
        `)
                .in("status", ["pending", "in_progress", "waiting_approval"])
                .order("created_at", { ascending: true }); // Oldest first to highlight negligence

            if (complaintsError) throw complaintsError;

            // Map combined data
            const finalData: PendingComplaint[] = (complaintsData || []).map(c => {
                const authority = getAuthorityDetails(c.category);
                return {
                    ...c,
                    location_address: c.location_address || "Unknown Location",
                    worker_name: authority.name,
                    worker_avatar: authority.image,
                };
            });

            setComplaints(finalData);
        } catch (error) {
            console.error("Error fetching billboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

    // Calculate days pending
    const getDaysPending = (dateString: string) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(dateString).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <Badge variant="destructive" className="mb-4 text-sm font-bold tracking-wider uppercase px-4 py-1 animate-pulse">
                    Public Accountability
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl font-black text-foreground uppercase tracking-tight">
                    The Wall of Shame
                </h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                    Highlighting the concerning authorities responsible for unresolved civic issues plaguing our city.
                </p>
            </motion.div>

            {complaints.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border flex flex-col items-center">
                    <TrendingUp className="h-16 w-16 text-success/50 mb-4" />
                    <h3 className="text-2xl font-bold text-foreground">Zero Pending Issues!</h3>
                    <p className="text-muted-foreground mt-2">All authorities are currently doing their job efficiently.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {complaints.map((complaint, index) => {
                        const daysPending = getDaysPending(complaint.created_at);

                        return (
                            <motion.div
                                key={complaint.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="overflow-hidden border-destructive/20 bg-gradient-to-br from-background to-destructive/5 hover:border-destructive/50 transition-colors shadow-lg">
                                    <div className="bg-destructive/10 px-6 py-4 border-b border-destructive/20 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-destructive font-black uppercase tracking-widest text-sm">
                                            <AlertTriangle className="h-4 w-4" />
                                            Pending Action
                                        </div>
                                        <Badge variant="outline" className="bg-background/80 font-mono font-bold text-destructive border-destructive/30">
                                            {daysPending} {daysPending === 1 ? 'DAY' : 'DAYS'}
                                        </Badge>
                                    </div>

                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center text-center mb-6">
                                            <div className="relative">
                                                <Avatar className="h-24 w-24 border-4 border-muted shadow-xl mb-4">
                                                    <AvatarImage src={complaint.worker_avatar} />
                                                    <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                                                        <UserX className="h-10 w-10 text-destructive/40" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                {daysPending > 5 && (
                                                    <div className="absolute -bottom-2 -right-2 bg-destructive text-destructive-foreground text-[10px] uppercase font-black px-2 py-1 rounded shadow-lg transform rotate-12">
                                                        Highly Negligent
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="font-display text-xl font-bold text-foreground leading-tight">
                                                {complaint.worker_name}
                                            </h3>
                                            <p className="text-sm font-medium text-destructive mt-1 uppercase tracking-wider">
                                                Responsible Authority
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border/50">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Issue Type</p>
                                                <p className="font-medium flex items-center gap-2">
                                                    {getCategoryLabel(complaint.category)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Location</p>
                                                <p className="text-sm border-l-2 border-primary/30 pl-3">
                                                    {complaint.location_address}
                                                </p>
                                            </div>

                                            <div className="bg-muted/50 rounded-md p-3 text-sm italic text-muted-foreground line-clamp-2">
                                                "{complaint.description}"
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Billboard;
