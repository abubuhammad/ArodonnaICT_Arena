import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/api";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { setEnrollment as setEnrollmentAction } from "../store/slices/enrollmentSlice";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { User, Clock, Target, CreditCard, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { refreshToken } from "../store/slices/authSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface Instructor {
  _id: string;
  name: string;
}

interface Course {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  instructor: string | Instructor;
  duration: string;
  level: string;
  thumbnail?: string;
}

interface Enrollment {
  _id: string;
  userId: string;
  courseId: {
    _id: string;
    title: string;
  };
  status: "enrolled" | "in-progress" | "completed";
  paymentStatus: "not-paid" | "pending" | "paid" | "waived";
  paymentMethod?: "paystack" | "bank-transfer";
  paymentReference?: string;
  createdAt: string;
  progressPercentage: number;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// Custom Alert Component
interface CustomAlertProps {
  variant: "error" | "success" | "warning";
  message: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ variant, message }) => {
  const bgColor = 
    variant === "error" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200" :
    variant === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200" :
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200";
  
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm leading-5 ${bgColor}`} role="alert">
      <p className="font-medium">{message}</p>
    </div>
  );
};

const BANK_DETAILS: BankDetails = {
  bankName: "First Bank Nigeria",
  accountNumber: "3052077731", 
  accountName: "Arodonna ICT Arena Ltd",
};

const Enroll: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  const [localEnrollment, setLocalEnrollment] = useState<Enrollment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank-transfer" | null>(null);
  const [transferReference, setTransferReference] = useState<string>("");
  const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
  const [transferRefSubmitted, setTransferRefSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        if (!courseId || courseId === 'undefined' || courseId === ':courseId') {
          setErrorMessage('Invalid course URL. Missing course id.');
          navigate('/courses');
          return;
        }
        if (!user || !token) return;
        
        const courseResponse = await api.get<Course>(`/courses/${courseId}`, { withCredentials: true });
        const normalizedCourse = {
          ...courseResponse.data,
          _id: courseResponse.data._id || (courseResponse.data as any).id,
        } as Course;
        setCourse(normalizedCourse);
        
        const { data: userEnrollments } = await api.get<Enrollment[]>(`/enrollments/my-courses`, { withCredentials: true });
        
        const existingEnrollment = userEnrollments.find(
          (enrollment) => enrollment.courseId._id === courseId
        );
        if (existingEnrollment) {
          setLocalEnrollment(existingEnrollment);
          dispatch(setEnrollmentAction(existingEnrollment));
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          try {
            const result = await dispatch(refreshToken()).unwrap();
            if (result.token) {
              fetchCourseAndEnrollment();
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            navigate('/login');
          }
        } else if (error.response?.status === 403) {
          setErrorMessage("You don't have permission to access this course.");
        } else if (error.response?.status === 404) {
          setErrorMessage("Course not found.");
        } else {
          setErrorMessage("Failed to load course information. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!user || !token) {
      navigate('/login');
    } else {
      fetchCourseAndEnrollment();
    }
  }, [courseId, user, token, dispatch, navigate]);

  const handleContinueCourse = () => {
    navigate(`/courses/${courseId}/learn`);
  };

  const handleFreeEnrollment = async () => {
    if (!course || !user || !token) return;
    setEnrolling(true);
    try {
      const cid = course._id || course.id;
      const { data } = await api.post(`/enrollments`, { courseId: cid });
      dispatch(setEnrollmentAction(data.enrollment));
      setLocalEnrollment(data.enrollment);
      setSuccessMessage("You have successfully enrolled in this course!");
      setTimeout(() => {
        const cid = course._id || course.id || courseId;
        navigate(`/courses/${cid}/learn`);
      }, 2000);
    } catch (error: any) {
      console.error("Enrollment failed:", error);
      if (error.response?.status === 409) {
        setErrorMessage("You are already enrolled in this course.");
      } else {
        setErrorMessage("Enrollment failed. Please try again later.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  const initiatePaystackPayment = async () => {
    if (!course || !user || !token) return;
    
    // Clear any previous error messages
    setErrorMessage("");
    
    // Check if Paystack is loaded
    if (!(window as any).PaystackPop) {
      setErrorMessage("Paystack payment system is not available. Please refresh the page and try again.");
      return;
    }
    
    setEnrolling(true);
    
    // Get the public key and validate it
    const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey || publicKey === "pk_test_default_key" || publicKey === "") {
      setErrorMessage("Payment system is not properly configured. Please contact support or use bank transfer.");
      setEnrolling(false);
      return;
    }

    // Validate required parameters
    if (!user.email || !course.price || course.price <= 0) {
      setErrorMessage("Invalid payment details. Please try again or contact support.");
      setEnrolling(false);
      return;
    }

    try {
      // Create a unique reference
      const reference = `ARENA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const handler = (window as any).PaystackPop.setup({
        key: publicKey.trim(),
        email: user.email.trim(),
        amount: Math.round(course.price * 100), // Convert to kobo (smallest currency unit)
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Course Title",
              variable_name: "course_title",
              value: course.title
            },
            {
              display_name: "User Name", 
              variable_name: "user_name",
              value: user.name
            }
          ]
        },
        callback: function(response: any) {
          console.log("Paystack payment successful:", response);
          if (response && response.status === "success" && response.reference) {
            handlePaymentSuccess(response.reference);
          } else {
            setErrorMessage("Payment verification failed. Please try again.");
            setEnrolling(false);
          }
        },
        onClose: function() {
          console.log("Paystack popup closed by user");
          setErrorMessage("Payment was cancelled.");
          setEnrolling(false);
        },
      });
      
      handler.openIframe();
    } catch (error: any) {
      console.error("Error initializing Paystack:", error);
      let errorMsg = "Failed to initialize payment system. ";
      
      if (error.message) {
        if (error.message.includes("400") || error.message.includes("Bad Request")) {
          errorMsg += "Please check your internet connection and try again. ";
        } else if (error.message.includes("key")) {
          errorMsg += "Payment configuration error. ";
        }
      }
      
      errorMsg += "You can try using bank transfer instead.";
      setErrorMessage(errorMsg);
      setEnrolling(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    if (!course || !token) return;
    
    try {
      const { data: enrollmentData } = await api.post(`/enrollments`, { courseId: course._id, paymentMethod: "paystack", paymentReference: reference }, { withCredentials: true });
      setLocalEnrollment(enrollmentData.enrollment);
      dispatch(setEnrollmentAction(enrollmentData.enrollment));
      setSuccessMessage("Payment successful! You are now enrolled in this course.");
      setTimeout(() => {
        navigate(`/courses/${courseId}/learn`);
      }, 2000);
    } catch (error: any) {
      console.error("Enrollment failed after payment:", error);
      const errorMsg = error.response?.data?.error || "Payment was successful, but enrollment failed. Please contact support with reference: " + reference;
      setErrorMessage(errorMsg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleBankTransfer = () => {
    setShowBankDetails(true);
  };

  const submitTransferReference = async () => {
    if (!transferReference.trim()) {
      setErrorMessage("Please enter your payment reference number.");
      return;
    }
    if (!course || !user || !token) return;
    setEnrolling(true);
    try {
      const { data: enrollmentData } = await api.post(`/enrollments`, { courseId: course._id, paymentMethod: "bank-transfer", paymentReference: transferReference }, { withCredentials: true });
      setLocalEnrollment(enrollmentData.enrollment);
      dispatch(setEnrollmentAction(enrollmentData.enrollment));
      setTransferRefSubmitted(true);
      setSuccessMessage("Your payment reference has been submitted. Access will be granted once payment is verified.");
      setShowBankDetails(false);
    } catch (error: any) {
      console.error("Reference submission failed:", error);
      const errorMsg = error.response?.data?.error || "Failed to submit payment reference. Please try again.";
      setErrorMessage(errorMsg);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center px-6 py-12 text-center">
        <h2 className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Course not found</h2>
        <p className="mt-2 max-w-md text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">The course you are looking for does not exist or has been removed.</p>
        <Button className="mt-4" onClick={() => navigate("/courses")}>
          Browse Courses
        </Button>
      </div>
    );
  }

  // If already enrolled, show enrollment status
  if (localEnrollment) {
    if (localEnrollment.paymentStatus === "pending") {
      return (
        <Card className="mx-auto my-8 w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
              <h3 className="text-lg font-semibold leading-7">Payment pending verification</h3>
              <p className="mt-2 text-sm leading-5">
                Your payment for this course is being verified. You will gain access once confirmed.
              </p>
            </div>
            <div className="mt-6 space-y-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
              <p><span className="font-medium text-slate-950 dark:text-slate-50">Payment reference:</span> {localEnrollment.paymentReference}</p>
              <p><span className="font-medium text-slate-950 dark:text-slate-50">Payment method:</span> {localEnrollment.paymentMethod === "paystack" ? "Paystack" : "Bank Transfer"}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    return (
      <Card className="mx-auto my-8 w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
            <h3 className="text-lg font-semibold leading-7">You're enrolled</h3>
            <p className="mt-2 text-sm leading-5">
              You're already enrolled in this course. Continue learning from where you left off.
            </p>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm font-medium leading-5 text-slate-600 dark:text-slate-400">
              <span>Course progress</span>
              <span className="text-indigo-600 dark:text-indigo-400">{localEnrollment.progressPercentage}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={localEnrollment.progressPercentage} aria-label="Course progress">
              <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${Math.min(Math.max(localEnrollment.progressPercentage, 0), 100)}%` }} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinueCourse}>Continue Learning</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16">
      {/* Show error message if exists */}
      {errorMessage && (
        <CustomAlert variant="error" message={errorMessage} />
      )}
      
      {/* Show success message if exists */}
      {successMessage && (
        <CustomAlert variant="success" message={successMessage} />
      )}
      
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Course enrollment</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Choose how you want to begin</h1>
        <p className="mt-3 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Review the course details, select a payment method, and we will confirm your access.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-8">{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Course Preview Section */}
            <div className="space-y-6">
              {course.thumbnail && (
                <div className="relative group overflow-hidden rounded-xl">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <p className="text-base font-normal leading-6 text-slate-600 dark:text-slate-400">{course.description}</p>
            </div>

            {/* Course Details Section */}
            <div className="space-y-6">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Instructor</p>
                    <p className="text-base font-medium leading-6 text-slate-950 dark:text-slate-50">{typeof course.instructor === 'object' ? course.instructor.name : course.instructor}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Duration</p>
                    <p className="text-base font-medium leading-6 text-slate-950 dark:text-slate-50">{course.duration}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Level</p>
                    <p className="text-base font-medium leading-6 text-slate-950 dark:text-slate-50">{course.level}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Price</p>
                    <p className="text-base font-medium leading-6 text-slate-950 dark:text-slate-50">{course.isFree ? "Free" : `₦${course.price.toLocaleString()}`}</p>
                  </div>
                </div>
              </div>

              {/* Payment Section for paid courses */}
              {!course.isFree && !transferRefSubmitted && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">Select payment method</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className={`p-6 rounded-xl transition-all duration-200 ${
                        paymentMethod === "paystack" 
                          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/10"
                          : "hover:border-indigo-300 hover:bg-indigo-50/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/10"
                      }`}
                      onClick={() => setPaymentMethod("paystack")}
                    >
                      <CreditCard className="mb-2 h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      Pay with Paystack
                    </Button>
                    <Button
                      variant="outline"
                      className={`p-6 rounded-xl transition-all duration-200 ${
                        paymentMethod === "bank-transfer" 
                          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/10"
                          : "hover:border-indigo-300 hover:bg-indigo-50/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/10"
                      }`}
                      onClick={() => setPaymentMethod("bank-transfer")}
                    >
                      <Building2 className="mb-2 h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      Bank Transfer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {course.isFree ? (
            <Button 
              onClick={handleFreeEnrollment} 
              disabled={enrolling} 
              className="w-full sm:w-auto"
            >
              {enrolling ? <LoadingSpinner /> : "Enroll for Free"}
            </Button>
          ) : paymentMethod === "paystack" ? (
            <Button 
              onClick={initiatePaystackPayment} 
              disabled={enrolling} 
              className="w-full sm:w-auto"
            >
              {enrolling ? <LoadingSpinner /> : `Pay ₦${course.price.toLocaleString()} with Paystack`}
            </Button>
          ) : paymentMethod === "bank-transfer" ? (
            <Button 
              onClick={handleBankTransfer} 
              disabled={enrolling || showBankDetails} 
              className="w-full sm:w-auto"
            >
              {enrolling ? <LoadingSpinner /> : "Proceed with Bank Transfer"}
            </Button>
          ) : (
            <Button disabled={true} className="w-full sm:w-auto">
              Select a payment method
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate("/courses")} 
            className="w-full sm:w-auto"
          >
            Back to Courses
          </Button>
        </CardFooter>
      </Card>
      
      {/* Bank Transfer Modal */}
      {showBankDetails && (
        <AlertDialog open={showBankDetails} onOpenChange={setShowBankDetails}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Complete your bank transfer</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">
                Transfer the exact amount to the account below and provide your payment reference for verification.
              </AlertDialogDescription>
            </AlertDialogHeader>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">Bank name</span>
                    <span className="text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">{BANK_DETAILS.bankName}</span>
                </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">Account number</span>
                    <span className="font-mono text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">{BANK_DETAILS.accountNumber}</span>
                </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">Account name</span>
                    <span className="text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">{BANK_DETAILS.accountName}</span>
                </div>
                  <div className="flex flex-col gap-1 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <span className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">Amount to transfer</span>
                    <span className="text-lg font-semibold leading-7 text-emerald-600 dark:text-emerald-400">₦{course.price.toLocaleString()}</span>
                </div>
              </div>
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                  <p>
                    <strong>Important:</strong> Use your full name and email as the transfer description/narration for easy identification.
                </p>
              </div>
            </div>
            <div className="mt-6">
                <label className="mb-2 block text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">
                  Payment reference / transaction ID <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input 
                type="text" 
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Enter your transaction reference number"
              />
                <p className="mt-2 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">
                This is the reference/ID you received after making the transfer
              </p>
            </div>
            {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm leading-5 text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200" role="alert">
                  <p>{errorMessage}</p>
              </div>
            )}
              <AlertDialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowBankDetails(false)}
                disabled={enrolling}
              >
                Cancel
              </Button>
              <AlertDialogAction 
                onClick={submitTransferReference} 
                disabled={!transferReference.trim() || enrolling}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {enrolling ? <LoadingSpinner size="sm" /> : "Submit Reference"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Enroll;
