import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, BarChart3, MapPin, Zap, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-city.jpg";
import { SAMPLE_COMPLAINTS } from "@/data/mockData";

const stats = [
  { label: "Complaints Filed", value: SAMPLE_COMPLAINTS.length, icon: FileText },
  { label: "Resolved", value: SAMPLE_COMPLAINTS.filter(c => c.status === "resolved").length, icon: CheckCircle },
  { label: "In Progress", value: SAMPLE_COMPLAINTS.filter(c => c.status === "in_progress").length, icon: Clock },
];

const features = [
  {
    icon: Zap,
    title: "AI-Powered Categorization",
    description: "Complaints are automatically categorized and prioritized using AI image and text analysis.",
  },
  {
    icon: MapPin,
    title: "GPS Auto-Location",
    description: "Precise location tagging with GPS auto-detection for accurate issue mapping.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Municipal officials get live dashboards with heatmaps and performance metrics.",
  },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Smart city aerial view" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>
        <div className="container relative z-10 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Your City,{" "}
              <span className="text-accent">Your Voice</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
              Report civic issues instantly. Track progress in real-time. 
              Nagar Niti uses AI to ensure your complaints reach the right department, fast.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/complaint/new">
                  File a Complaint <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/complaints">Track Status</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-12">
        <div className="container grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-4 rounded-xl border border-border bg-background p-6 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              A smarter way to manage urban grievances
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
                className="group rounded-xl border border-border bg-card p-8 shadow-card transition-shadow hover:shadow-elevated"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Ready to make your city better?
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            It takes less than a minute to file a complaint.
          </p>
          <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/complaint/new">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
