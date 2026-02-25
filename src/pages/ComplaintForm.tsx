import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/data/mockData";
import { ComplaintCategory, ComplaintPriority } from "@/data/types";

const ComplaintForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [priority, setPriority] = useState<ComplaintPriority | "">("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !address) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast({ title: "Complaint Submitted!", description: `Your complaint ID is C-${1000 + Math.floor(Math.random() * 9000)}` });
      setSubmitting(false);
      navigate("/complaints");
    }, 1200);
  };

  return (
    <div className="container max-w-2xl py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">File a Complaint</h1>
        <p className="mt-2 text-muted-foreground">Describe your civic issue and we'll route it to the right department.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select complaint category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as ComplaintPriority)}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-assigned by AI (or select manually)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔴 High — Urgent / Dangerous</SelectItem>
                <SelectItem value="medium">🟡 Medium — Needs attention</SelectItem>
                <SelectItem value="low">🟢 Low — Minor issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address or use GPS"
                className="pl-10"
              />
            </div>
          </div>

          {/* Photo upload placeholder */}
          <div className="space-y-2">
            <Label>Photo Evidence</Label>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 transition-colors hover:border-primary/50">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground/70">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : (
              <>Submit Complaint <Send className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ComplaintForm;
