export type ComplaintCategory = 
  | "waste_management"
  | "water_supply"
  | "road_potholes"
  | "streetlight"
  | "drainage"
  | "sanitation";

export type ComplaintPriority = "high" | "medium" | "low";

export type ComplaintStatus = "pending" | "in_progress" | "resolved";

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Complaint {
  id: string;
  userId: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: Location;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}
