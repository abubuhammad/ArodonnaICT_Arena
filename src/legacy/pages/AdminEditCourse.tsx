import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface Course {
  _id: string;
  title: string;
  description: string;
  // add other course fields as needed
}

const AdminEditCourse: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get<Course>(`/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(res.data);
      } catch (err) {
        setError("Failed to fetch course details");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(`/api/courses/${courseId}`, course, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/admin/dashboard"); // redirect after update
    } catch (err) {
      setError("Failed to update course");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!course) return <div>No course data found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Course (Admin)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <Input
            value={course.title}
            onChange={(e) =>
              setCourse({ ...course, title: e.target.value })
            }
            placeholder="Course Title"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            placeholder="Course Description"
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Add more fields as needed */}
        <Button type="submit">Update Course</Button>
      </form>
    </div>
  );
};

export default AdminEditCourse;
