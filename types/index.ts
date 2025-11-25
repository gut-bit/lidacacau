export type UserRole = 'producer' | 'worker' | 'admin';

export type JobStatus = 'open' | 'assigned' | 'closed';

export type WorkOrderStatus = 'assigned' | 'checked_in' | 'checked_out' | 'completed';

export type WorkerLevel = 1 | 2 | 3 | 4 | 5;

export interface Property {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar?: string;
  level?: WorkerLevel;
  totalReviews?: number;
  averageRating?: number;
  properties?: Property[];
  tutorialCompleted?: boolean;
  createdAt: string;
}

export interface ServiceType {
  id: string;
  name: string;
  unit: string;
  basePrice: number;
  minLevel: WorkerLevel;
  icon: string;
}

export interface Job {
  id: string;
  producerId: string;
  serviceTypeId: string;
  quantity: number;
  locationText: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  offer: number;
  notes?: string;
  photos?: string[];
  status: JobStatus;
  createdAt: string;
}

export interface Bid {
  id: string;
  jobId: string;
  workerId: string;
  price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  jobId: string;
  workerId: string;
  producerId: string;
  finalPrice: number;
  status: WorkOrderStatus;
  checkInTime?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutTime?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  photoBefore?: string;
  photoAfter?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  workOrderId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'producer' | 'worker';
  quality: number;
  safety: number;
  punctuality: number;
  communication: number;
  fairness: number;
  comment?: string;
  createdAt: string;
}

export interface JobWithDetails extends Job {
  serviceType: ServiceType;
  producer: User;
  bids: BidWithWorker[];
  workOrder?: WorkOrderWithDetails;
}

export interface BidWithWorker extends Bid {
  worker: User;
}

export interface WorkOrderWithDetails extends WorkOrder {
  job: Job;
  serviceType: ServiceType;
  worker: User;
  producer: User;
  producerReview?: Review;
  workerReview?: Review;
}
