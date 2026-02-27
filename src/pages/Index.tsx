import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, BarChart3, MapPin, Zap, CheckCircle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-city.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: statsData } = useQuery({
    queryKey: ["complaint-stats"],
    queryFn: async () => {
      const { data, count } = await supabase
        .from("complaints")
        .select("*", { count: "exact" });

      const resolved = data?.filter(c => c.status === "resolved").length || 0;
      const inProgress = data?.filter(c => c.status === "in_progress").length || 0;

      return [
        { label: "Complaints Filed", value: count || 0, icon: FileText },
        { label: "Resolved", value: resolved, icon: CheckCircle },
        { label: "In Progress", value: inProgress, icon: Clock },
      ];
    },
  });

  const displayStats = statsData || [
    { label: "Complaints Filed", value: 0, icon: FileText },
    { label: "Resolved", value: 0, icon: CheckCircle },
    { label: "In Progress", value: 0, icon: Clock },
  ];

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Categorization",
      tag: "SmartTech",
      description: "Complaints are automatically categorized and prioritized using AI image and text analysis, ensuring rapid response from the right departments.",
    },
    {
      icon: MapPin,
      title: "GPS Auto-Location",
      tag: "Precision",
      description: "Precise location tagging with GPS auto-detection for accurate issue mapping. No more manually searching for addresses.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      tag: "Analytics",
      description: "Municipal officials get live dashboards with heatmaps and performance metrics to optimize city resources effectively.",
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Smart city aerial view" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
        </div>
        <div className="container relative z-10 py-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground border border-secondary/30 mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">The Future of Urban Governance</span>
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-white md:text-7xl">
              NagarNiti: <br />
              <span className="text-secondary italic">Harmonizing</span> Your City
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-white/90 md:text-2xl max-w-xl">
              Empowering citizens to build better communities. Report civic issues, track real-time solutions, and witness the transformation of your neighborhood with AI-driven efficiency.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-14 px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95">
                <Link to="/complaint/new">
                  File a Complaint <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 text-lg rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95">
                <Link to="/complaints">Track Status</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-10 z-20 pb-12">
        <div className="container">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {displayStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-5 rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-display text-4xl font-black text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section Tag */}
      <div className="container mt-20 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold border border-primary/10 mb-4 uppercase tracking-widest">
          Why Trust NagarNiti?
        </div>
      </div>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Transparent & Reliable
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform bridges the gap between citizens and authorities through transparency, accountability, and cutting-edge technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:-translate-y-2 hover:shadow-elevated overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src="/Nagar_Niti_Logo.png" alt="Logo" className="h-24 w-24 object-contain" />
                </div>

                <div className="relative z-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="inline-block px-2 py-0.5 mb-3 rounded-md bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-thicker border border-secondary/20">
                    {feature.tag}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Description / Mission */}
      <section className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-bold border border-white/20 mb-6 uppercase tracking-widest">
                Our Mission
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 italic">
                A Smarter City is a <span className="text-secondary">Community</span> Effort.
              </h2>
              <p className="text-xl text-white/80 leading-relaxed mb-8">
                NagarNiti is not just a portal; it's a movement towards 100% urban transparency. We believe every citizen should have a direct line to the heartbeat of their city, and every official should have the tools to perform at their best.
              </p>
              <ul className="space-y-4">
                {[
                  "Citizen-centric interface for easy reporting",
                  "AI-driven route optimization for municipal workers",
                  "Public accountability through local billboards",
                  "Rewarding active community members"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-secondary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square lg:aspect-video rounded-3xl overflow-hidden shadow-2xl border-8 border-white/5"
            >
              <img src={heroImage} alt="Community together" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-secondary/20 mix-blend-overlay" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-gradient-hero p-12 md:p-20 text-white shadow-2xl"
          >
            <h2 className="font-display text-4xl font-bold text-black md:text-6xl max-w-3xl mx-auto leading-tight">
              Ready to fine-tune your neighborhood?
            </h2>
            <p className="mt-8 text-xl text-black/80 max-w-xl mx-auto leading-relaxed">
              Join thousands of citizens making their voices heard and contributing to a cleaner, safer city.
            </p>
            <div className="mt-12 group inline-block">
              <Button asChild size="lg" className="h-16 px-12 bg-white text-primary hover:bg-secondary hover:text-white text-xl font-bold rounded-2xl shadow-xl transition-all duration-300">
                <Link to="/complaint/new">
                  Get Started Now <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;

