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
    variant === "error" ? "bg-red-50 border-red-200 text-red-800" :
    variant === "success" ? "bg-green-50 border-green-200 text-green-800" :
    "bg-yellow-50 border-yellow-200 text-yellow-800";
  
  return (
    <div className={`p-4 rounded-md border mb-4 ${bgColor}`}>
      <p>{message}</p>
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
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Course Not Found</h2>
        <p className="mt-4">The course you're looking for doesn't exist or has been removed.</p>
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
        <Card className="max-w-2xl mx-auto my-8">
          <CardHeader>
            <CardTitle>{course.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
              <h3 className="text-lg font-semibold text-yellow-800">Payment Pending Verification</h3>
              <p className="mt-2">
                Your payment for this course is being verified. You will gain access once confirmed.
              </p>
            </div>
            <p><strong>Payment Reference:</strong> {localEnrollment.paymentReference}</p>
            <p><strong>Payment Method:</strong> {localEnrollment.paymentMethod === "paystack" ? "Paystack" : "Bank Transfer"}</p>
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
      <Card className="max-w-2xl mx-auto my-8">
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-4">
            <h3 className="text-lg font-semibold text-green-800">You're Enrolled!</h3>
            <p className="mt-2">
              You're already enrolled in this course. Continue learning from where you left off.
            </p>
          </div>
          <div className="mt-4">
            <p>
              <strong>Progress:</strong> {localEnrollment.progressPercentage}% completed
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinueCourse}>Continue Learning</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-4">
      {/* Show error message if exists */}
      {errorMessage && (
        <CustomAlert variant="error" message={errorMessage} />
      )}
      
      {/* Show success message if exists */}
      {successMessage && (
        <CustomAlert variant="success" message={successMessage} />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
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
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>

            {/* Course Details Section */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Instructor</p>
                    <p className="font-medium">{typeof course.instructor === 'object' ? course.instructor.name : course.instructor}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{course.duration}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Level</p>
                    <p className="font-medium">{course.level}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-medium">{course.isFree ? "Free" : `₦${course.price.toLocaleString()}`}</p>
                  </div>
                </div>
              </div>

              {/* Payment Section for paid courses */}
              {!course.isFree && !transferRefSubmitted && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Select Payment Method</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className={`p-6 rounded-xl transition-all duration-200 ${
                        paymentMethod === "paystack" 
                          ? "ring-2 ring-blue-500 bg-blue-50" 
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => setPaymentMethod("paystack")}
                    >
                      <CreditCard className="h-8 w-8 mb-2 text-blue-600" />
                      Pay with Paystack
                    </Button>
                    <Button
                      variant="outline"
                      className={`p-6 rounded-xl transition-all duration-200 ${
                        paymentMethod === "bank-transfer" 
                          ? "ring-2 ring-green-500 bg-green-50" 
                          : "hover:bg-green-50"
                      }`}
                      onClick={() => setPaymentMethod("bank-transfer")}
                    >
                      <Building2 className="h-8 w-8 mb-2 text-green-600" />
                      Bank Transfer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 items-stretch sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
          {course.isFree ? (
            <Button 
              onClick={handleFreeEnrollment} 
              disabled={enrolling} 
              className="w-full sm:w-auto bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-md text-white font-bold py-3 px-6 rounded-lg"
            >
              {enrolling ? <LoadingSpinner /> : "Enroll for Free"}
            </Button>
          ) : paymentMethod === "paystack" ? (
            <Button 
              onClick={initiatePaystackPayment} 
              disabled={enrolling} 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-md text-white font-bold py-3 px-6 rounded-lg"
            >
              {enrolling ? <LoadingSpinner /> : `Pay ₦${course.price.toLocaleString()} with Paystack`}
            </Button>
          ) : paymentMethod === "bank-transfer" ? (
            <Button 
              onClick={handleBankTransfer} 
              disabled={enrolling || showBankDetails} 
              className="w-full sm:w-auto bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-md text-white font-bold py-3 px-6 rounded-lg"
            >
              {enrolling ? <LoadingSpinner /> : "Proceed with Bank Transfer"}
            </Button>
          ) : (
            <Button disabled={true} className="w-full sm:w-auto bg-gray-400 text-white py-3 px-6 rounded-lg">
              Select a payment method
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate("/courses")} 
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-full shadow-md"
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
              <AlertDialogTitle className="text-xl font-bold">Complete Your Bank Transfer</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Transfer the exact amount to the account below and provide your payment reference for verification.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Bank Name:</span>
                  <span className="font-bold text-gray-900">{BANK_DETAILS.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Account Number:</span>
                  <span className="font-bold text-gray-900 font-mono">{BANK_DETAILS.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Account Name:</span>
                  <span className="font-bold text-gray-900">{BANK_DETAILS.accountName}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-medium text-gray-700">Amount to Transfer:</span>
                  <span className="font-bold text-lg text-green-600">₦{course.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Use your full name and email as the transfer description/narration for easy identification.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference/Transaction ID <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Enter your transaction reference number"
              />
              <p className="mt-1 text-sm text-gray-500">
                This is the reference/ID you received after making the transfer
              </p>
            </div>
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}
            <AlertDialogFooter className="flex space-x-3">
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
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
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
