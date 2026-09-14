// src/components/admin/EnrollmentList.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import adminApi from "../../utils/adminApi";

interface Enrollment {
  _id: string;
  user?: { _id?: string; id?: string; name?: string; email?: string };
  course?: { _id?: string; id?: string; title?: string };
  status?: string;
  paymentStatus?: string;
  progressPercentage?: number;
}

interface EnrollmentListProps {
  adminToken: string;
  onRefresh?: () => void;
  onGrantFree?: (enrollment: Enrollment) => void;
  refreshSignal?: number;
}

const EnrollmentList: React.FC<EnrollmentListProps> = ({ adminToken, onRefresh, onGrantFree, refreshSignal }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    if (!adminToken) return;

    setLoading(true);
    try {
      const res = await adminApi.get("/admin/enrollments");
      const data = res.data;
      const enrollmentArray = Array.isArray(data) ? data : data?.enrollments || [];
      const normalized: Enrollment[] = enrollmentArray.map((e: any) => ({
        _id: e?._id || e?.id || "",
        user: e?.user || e?.userId,
        course: e?.course || e?.courseId,
        status: e?.status || "ENROLLED",
        paymentStatus: e?.paymentStatus || "PENDING",
        progressPercentage: typeof e?.progressPercentage === "number" ? e.progressPercentage : 0,
      })).filter((e: Enrollment) => Boolean(e._id));
      setEnrollments(normalized);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchEnrollments();
  }, [adminToken, fetchEnrollments, refreshSignal]);

  const handleDelete = async (enrollmentId: string) => {
    try {
      await adminApi.delete(`/admin/enrollments/${enrollmentId}`);
      setEnrollments(prev => prev.filter((e) => e._id !== enrollmentId));
    } catch (error) {
      console.error("Error deleting enrollment:", error);
    }
  };

  const handleApprovePayment = async (enrollmentId: string) => {
    try {
      await adminApi.patch(`/admin/enrollments/${enrollmentId}/verify-payment`, { verified: true });
      fetchEnrollments();
    } catch (error) {
      console.error("Error approving payment:", error);
    }
  };

  const handleGrantFree = async (enrollment: Enrollment) => {
    if (onGrantFree) {
      onGrantFree(enrollment);
      return;
    }
    if (!enrollment._id) return;
    try {
      await adminApi.patch(`/admin/enrollments/${enrollment._id}/grant-free`);
      fetchEnrollments();
    } catch (error) {
      console.error("Error granting free access:", error);
    }
  };

  const handleRefresh = () => {
    fetchEnrollments();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Enrollments</CardTitle>
        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner />
        ) : enrollments.length === 0 ? (
          <p>No enrollments found.</p>
        ) : (
          enrollments.map((enrollment) => (
            <div key={enrollment._id} className="flex justify-between items-center p-2 border-b">
              <div>
                <p>
                  <strong>User:</strong> {enrollment.user?.name || "N/A"} (
                  {enrollment.user?.email || "N/A"})
                </p>
                <p>
                  <strong>Course:</strong> {enrollment.course?.title || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {enrollment.status}
                </p>
                <p>
                  <strong>Payment:</strong> {enrollment.paymentStatus}
                </p>
                <p>
                  <strong>Progress:</strong> {enrollment.progressPercentage}%
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="destructive" onClick={() => handleDelete(enrollment._id)}>
                  Delete
                </Button>
                {enrollment.paymentStatus === "pending" && (
                  <Button variant="outline" className="bg-green-100 hover:bg-green-200" onClick={() => handleApprovePayment(enrollment._id)}>
                    Approve Payment
                  </Button>
                )}
                <Button onClick={() => handleGrantFree(enrollment)}>
                  Grant Free Access
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default EnrollmentList;
