import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import api from "../../utils/api";

interface InstructorProfileProps {
  instructor: {
    _id: string;
    name: string;
    email: string;
    title?: string;
    bio?: string;
    avatar?: string;
    isAvailableForCall?: boolean;
    expertise?: string[];
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
    };
  };
  onUpdate: () => void;
}

const InstructorProfile: React.FC<InstructorProfileProps> = ({ instructor, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: instructor.name,
    title: instructor.title || "",
    bio: instructor.bio || "",
    isAvailableForCall: instructor.isAvailableForCall || false,
    expertise: instructor.expertise?.join(", ") || "",
    socialLinks: {
      linkedin: instructor.socialLinks?.linkedin || "",
      twitter: instructor.socialLinks?.twitter || "",
      github: instructor.socialLinks?.github || "",
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("socialLinks.")) {
      const socialLink = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialLink]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isAvailableForCall: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const expertiseArray = formData.expertise
        .split(",")
        .map(item => item.trim())
        .filter(item => item);

      const updatedData = {
        ...formData,
        expertise: expertiseArray,
      };

      await api.put(`/instructors/${instructor._id}`, updatedData);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Instructor Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Professional Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself and your expertise..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Areas of Expertise</Label>
            <Input
              id="expertise"
              name="expertise"
              value={formData.expertise}
              onChange={handleChange}
              placeholder="e.g., JavaScript, React, Node.js"
            />
            <p className="text-sm text-gray-500">Separate multiple areas with commas</p>
          </div>

          <div className="space-y-4">
            <Label>Social Links</Label>
            <div className="space-y-2">
              <Input
                name="socialLinks.linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn Profile URL"
              />
              <Input
                name="socialLinks.twitter"
                value={formData.socialLinks.twitter}
                onChange={handleChange}
                placeholder="Twitter Profile URL"
              />
              <Input
                name="socialLinks.github"
                value={formData.socialLinks.github}
                onChange={handleChange}
                placeholder="GitHub Profile URL"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isAvailableForCall"
              checked={formData.isAvailableForCall}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isAvailableForCall">Available for Live Calls</Label>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <LoadingSpinner size="sm" /> : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InstructorProfile; 