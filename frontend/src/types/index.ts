// Course related types
export interface Course {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    isFree: boolean;
    instructor: string;
    level: string;
    duration: string;
    category: string;
    progress?: number;
    progressPercentage?: number;
    status?: 'not-started' | 'in-progress' | 'completed';
    enrollmentStatus?: 'pending' | 'enrolled' | 'in-progress' | 'completed';
    lastAccessed?: Date;
    completionDate?: Date;
    certificate?: {
      id: string;
      issueDate: Date;
      grade: string;
    };
}
  
  // User related types
  export interface User {
    _id: string;
    name: string;
    role: "student" | "instructor" | "admin" | "pending";
    email: string;
  }
  
  // Props types for components
  export interface CourseCardProps {
    course: Course;
    onEnroll?: (courseId: string) => void;
    isAuthenticated?: boolean;
  }
  
  export interface StatItemProps {
    icon: React.ComponentType<any>;
    value: string;
    label: string;
  }
  
  export interface HeroSectionProps {
    title: string;
    description: string;
    primaryButtonText: string;
    secondaryButtonText: string;
    onPrimaryClick: () => void;
    onSecondaryClick: () => void;
    imageUrl?: string;  // new optional property
  }
  

export interface StudentStats {
  totalEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  averageProgress: number;
  totalHoursLearned: number;
  achievements: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  issueDate: Date;
  grade: string;
}

export interface AdminUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface AdminLoginResponse {
  message: string;
  token: string;
  admin: AdminUser;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}
