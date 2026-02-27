import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Target, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardUser {
    user_id: string;
    count: number;
    full_name: string;
    avatar_url?: string;
}

const Leaderboard = () => {
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Compute Current Quarter bounds
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const startOfQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59, 999);

    const formatQuarter = `Q${currentQuarter} ${now.getFullYear()}`;

    const fetchLeaderboard = async () => {
        try {
            // Fetch all complaints from the current quarter created by logged in users
            const { data: complaints, error: complaintsError } = await supabase
                .from("complaints")
                .select("user_id")
                .gte("created_at", startOfQuarter.toISOString())
                .lte("created_at", endOfQuarter.toISOString())
                .not("user_id", "is", null);

            if (complaintsError) throw complaintsError;

            // Group and count complaints per user
            const userCounts: Record<string, number> = {};
            (complaints || []).forEach(c => {
                if (c.user_id) {
                    userCounts[c.user_id] = (userCounts[c.user_id] || 0) + 1;
                }
            });

            // Sort users by count descending and take top 10
            const sortedUserIds = Object.keys(userCounts).sort((a, b) => userCounts[b] - userCounts[a]).slice(0, 10);

            if (sortedUserIds.length === 0) {
                setLeaders([]);
                setLoading(false);
                return;
            }

            // Fetch profiles for the top users
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .in("id", sortedUserIds);

            if (profilesError) throw profilesError;

            const profileMap: Record<string, any> = {};
            (profiles || []).forEach(p => {
                profileMap[p.id] = p;
            });

            // Map back to leaderboard data array
            const leaderboardData: LeaderboardUser[] = sortedUserIds.map(userId => ({
                user_id: userId,
                count: userCounts[userId],
                full_name: profileMap[userId]?.full_name || "Civic Hero",
                avatar_url: profileMap[userId]?.avatar_url || undefined,
            }));

            setLeaders(leaderboardData);
        } catch (error) {
            console.error("Error fetching leaderboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="font-display text-4xl font-bold text-foreground">Civic Leaderboard</h1>
                <p className="mt-2 text-xl text-muted-foreground">
                    Rewarding our most active citizens for {formatQuarter}
                </p>
                <p className="mt-2 text-sm text-primary font-medium max-w-xl mx-auto">
                    Every quarter, the top reporting citizens receive a civic hero reward for helping authorities maintain the city infrastructure.
                </p>
            </motion.div>

            <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Top Reporters ({formatQuarter})
                    </CardTitle>
                    <CardDescription>
                        Ranking is based on the number of authenticated complaints submitted during this quarter.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {leaders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                            <Target className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p>No complaints filed yet this quarter. Be the first to secure the top spot!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {leaders.map((user, index) => {
                                const isTop3 = index < 3;
                                let RankIcon = null;
                                if (index === 0) RankIcon = <Medal className="h-6 w-6 text-yellow-400" />;
                                else if (index === 1) RankIcon = <Medal className="h-6 w-6 text-slate-300" />;
                                else if (index === 2) RankIcon = <Medal className="h-6 w-6 text-amber-700" />;

                                return (
                                    <motion.div
                                        key={user.user_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center p-4 sm:px-6 transition-colors hover:bg-muted/50 ${isTop3 ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="w-8 md:w-12 font-bold text-muted-foreground flex justify-center">
                                            {RankIcon ? RankIcon : `#${index + 1}`}
                                        </div>

                                        <Avatar className={`h-10 w-10 md:h-12 md:w-12 border-2 mx-4 ${isTop3 ? 'border-primary' : 'border-transparent'}`}>
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {user.full_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <h3 className={`font-bold ${isTop3 ? 'text-lg text-foreground' : 'text-base text-muted-foreground'}`}>
                                                {user.full_name}
                                            </h3>
                                            {isTop3 && index === 0 && <p className="text-xs font-semibold text-yellow-600">Quarterly Champion 👑</p>}
                                        </div>

                                        <div className="text-right flex flex-col items-end">
                                            <span className={`font-display font-bold text-2xl ${isTop3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {user.count}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Reports</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Leaderboard;
