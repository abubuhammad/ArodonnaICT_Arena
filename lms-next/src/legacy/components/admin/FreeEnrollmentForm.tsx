import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface SimpleUser {
  _id: string;
  name?: string;
  email?: string;
}

interface SimpleCourse {
  _id: string;
  title?: string;
  price?: number;
  isFree?: boolean;
}

interface FreeEnrollmentFormProps {
  users: SimpleUser[];
  courses: SimpleCourse[];
  onSubmit: (userId: string, courseId: string) => Promise<void>;
}

const FreeEnrollmentForm: React.FC<FreeEnrollmentFormProps> = ({ users, courses, onSubmit }) => {
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paidCourses = courses.filter((c) => !c.isFree && (c.price ?? 0) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!userId || !courseId) {
      setError("Select both a student and a paid course.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(userId, courseId);
      setMessage("Free enrollment granted successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to grant free enrollment.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Grant Free Enrollment</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Student</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select a student</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || "Unnamed"} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Paid Course</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Select a course</option>
              {paidCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title || "Untitled"} {typeof c.price === "number" ? ` - ₦${c.price}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Granting..." : "Grant Free Access"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FreeEnrollmentForm;
