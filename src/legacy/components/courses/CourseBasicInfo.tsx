import React, { useEffect, useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import type { Assessment } from "../../types/course";

export interface CreateCourseData {
  title: string;
  description: string;
  category: string;
  price: number;
  isFree: boolean;
  thumbnail: string;
  duration?: string;
  modules: any[];
  finalAssessment?: Assessment | null;
}

interface CourseBasicInfoProps {
  courseData: CreateCourseData;
  handleCourseDataChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  thumbnailPreview: string | null;
  onFreeCourseChange: (checked: boolean) => void;
}

const CourseBasicInfo: React.FC<CourseBasicInfoProps> = ({
  courseData,
  handleCourseDataChange,
  handleThumbnailChange,
  thumbnailPreview,
  onFreeCourseChange,
}) => {
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", {
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl font-semibold mb-4">Course Details</h2>
      <div className="space-y-4">
        <input
          type="text"
          name="title"
          value={courseData.title}
          onChange={handleCourseDataChange}
          placeholder="Course Title"
          className="w-full p-3 border rounded-lg"
          required
        />
        <textarea
          name="description"
          value={courseData.description}
          onChange={handleCourseDataChange}
          placeholder="Course Description"
          className="w-full p-3 border rounded-lg h-32"
          required
        />

        {/* Thumbnail Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Thumbnail <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full p-2 border rounded-lg"
                required={!courseData.thumbnail}
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended size: 1280x720px (16:9 ratio)
              </p>
            </div>
            {thumbnailPreview ? (
              <div className="w-24 h-24 relative">
                <img
                  src={thumbnailPreview}
                  alt="Course thumbnail preview"
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Dynamic Categories Dropdown */}
          <select
            name="category"
            value={courseData.category}
            onChange={handleCourseDataChange}
            className="p-3 border rounded-lg"
            required
          >
            {categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))
            ) : (
              <>
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Business">Business</option>
              </>
            )}
          </select>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={courseData.isFree}
                onChange={(e) => onFreeCourseChange(e.target.checked)}
              />
              <span>Free Course</span>
            </label>
            {!courseData.isFree && (
              <input
                type="number"
                name="price"
                value={courseData.price}
                onChange={handleCourseDataChange}
                placeholder="Price"
                className="p-3 border rounded-lg w-32"
                min="0"
                required
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseBasicInfo;
