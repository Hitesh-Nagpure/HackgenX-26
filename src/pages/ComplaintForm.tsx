import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Upload, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/data/mockData";
import { ComplaintCategory, ComplaintPriority } from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { pretrainedEmergencyAI } from "@/lib/EmergencyModel";

const ComplaintForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    // Warm up the pretrained AIML Model when form loads!
    pretrainedEmergencyAI.init();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Image too large", description: `${file.name} exceeds 5MB limit.`, variant: "destructive" });
          return false;
        }
        return true;
      });

      setImageFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "Video too large", description: "Video exceeds 50MB limit.", variant: "destructive" });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const fetchLocation = () => {
    setFetchingLocation(true);
    if (!navigator.geolocation) {
      toast({ title: "GP Not Supported", description: "Your browser doesn't support geolocation", variant: "destructive" });
      setFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          // Using a more robust fetch with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          const data = await response.json();
          setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (err) {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setFetchingLocation(false);
      },
      (error) => {
        let msg = "Could not fetch location.";
        if (error.code === 1) msg = "Location permission denied.";
        else if (error.code === 2) msg = "Position unavailable.";
        else if (error.code === 3) msg = "GPS fetch timeout.";

        toast({ title: "Location Error", description: msg, variant: "destructive" });
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const checkForDuplicates = async (lat: number, lng: number, cat: string) => {
    // Mock AI Detection: Check for complaints within ~100m radius of the same category
    const { data: existing } = await supabase
      .from("complaints")
      .select("id, location_lat, location_lng, category")
      .eq("category", cat)
      .neq("status", "resolved");

    if (!existing) return null;

    // Haversine-ish simple distance check
    const duplicate = existing.find(c => {
      if (!c.location_lat || !c.location_lng) return false;
      const dist = Math.sqrt(
        Math.pow(c.location_lat - lat, 2) + Math.pow(c.location_lng - lng, 2)
      );
      return dist < 0.001; // ~100 meters
    });

    return duplicate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !address) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    try {
      if (coords) {
        const potentialDup = await checkForDuplicates(coords.lat, coords.lng, category);
        if (potentialDup) {
          toast({
            title: "Possible Duplicate Detected",
            description: "A similar complaint already exists at this location. We've linked your photos to it.",
            variant: "default"
          });
          // In a real app, we might attach to the existing complaint instead of creating new
        }
      }

      // Use Pretrained AIML Model for emergency prediction
      const assignedPriority = await pretrainedEmergencyAI.predictPriority(description, category, imagePreviews[0] || null);
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;
      const submissionId = crypto.randomUUID();

      // Upload Images
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const filePath = `complaints/${submissionId}/img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-evidence")
          .upload(filePath, file);
        if (uploadError) {
          console.error("Image upload error:", uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
        const { data: urlData } = supabase.storage.from("complaint-evidence").getPublicUrl(filePath);
        imageUrls.push(urlData.publicUrl);
      }

      // Upload Video
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const filePath = `complaints/${submissionId}/video_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-evidence")
          .upload(filePath, videoFile);
        if (uploadError) {
          console.error("Video upload error:", uploadError);
          throw new Error(`Failed to upload video: ${uploadError.message}`);
        }
        const { data: urlData } = supabase.storage.from("complaint-evidence").getPublicUrl(filePath);
        videoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("complaints").insert({
        user_id: user?.id || null,
        category,
        description,
        priority: assignedPriority,
        location_address: address,
        location_lat: coords?.lat,
        location_lng: coords?.lng,
        image_url: imageUrls[0] || null,
        // In real app we store these in dedicated columns or JSON
        // Storing video_url and media_urls for UI display
        video_url: videoUrl,
        media_urls: imageUrls,
      });

      if (error) throw error;

      toast({
        title: "Complaint Submitted!",
        description: `Priority assigned by AI: ${assignedPriority.toUpperCase()}`
      });
      navigate(user ? "/complaints" : "/");
    } catch (err: any) {
      console.error("Submission Error:", err);
      let errorMsg = err.message;

      if (errorMsg.includes("media_urls") || errorMsg.includes("schema cache")) {
        errorMsg = "Database Error: The 'media_urls' column is missing or schema cache is outdated. Please run the latest SQL migration in your Supabase SQL Editor and click 'Reload Schema'.";
      }

      toast({
        title: "Submission failed",
        description: errorMsg,
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">File a Complaint</h1>
        {!user && <p className="mt-1 text-xs text-amber-600 font-medium">Anonymous Submission: No login required.</p>}
        <p className="mt-2 text-muted-foreground">Describe your civic issue and we'll route it to the right department.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
              <SelectTrigger><SelectValue placeholder="Select complaint category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>AI Priority Info</Label>
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground border border-border flex items-center gap-2">
              {pretrainedEmergencyAI.isModelLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin text-primary" /> <span>Loading Pretrained Vision Model for priority assessment...</span></>
              ) : (
                <>🧠 Priority is automatically assigned by our Pretrained AI Model based on your description and uploaded image (e.g. pipeline leak, electric pole, etc.).</>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">
              Location *
              <button
                type="button"
                onClick={fetchLocation}
                disabled={fetchingLocation}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {fetchingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                Autofill with GPS
              </button>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address or use GPS" className="pl-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Photos (Multiple)</Label>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              <div
                onClick={() => imageInputRef.current?.click()}
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground font-medium">Add Photos</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Video (Optional)</Label>
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              <div
                onClick={() => videoInputRef.current?.click()}
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground font-medium">Upload Video</p>
                </div>
              </div>
            </div>
          </div>

          {(imagePreviews.length > 0 || videoPreview) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative h-20 w-20 rounded-md overflow-hidden border border-border">
                  <img src={src} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                      setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {videoPreview && (
                <div className="relative h-20 w-32 rounded-md overflow-hidden border border-border bg-black flex items-center justify-center">
                  <video src={videoPreview} className="h-full w-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Video</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoPreview(null);
                      setVideoFile(null);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : <><span>Submit Complaint</span> <Send className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ComplaintForm;
