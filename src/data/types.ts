export type ComplaintCategory =
  | "waste_management"
  | "water_supply"
  | "road_potholes"
  | "streetlight"
  | "drainage"
  | "sanitation";

export type ComplaintPriority = "high" | "medium" | "low";

export type ComplaintStatus = "pending" | "in_progress" | "waiting_approval" | "resolved";


export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Complaint {
  id: string;
  userId?: string; // Optional for anonymous submissions
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: Location;
  imageUrl?: string;
  videoUrl?: string; // Requirement 1: Optional section to upload videos
  mediaUrls?: string[]; // Requirement 5: Support multiple images
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  completedImageUrl?: string; // Requirement 6: Worker uploads completion photo
}
