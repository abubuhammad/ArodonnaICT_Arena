import React, { useMemo, useState } from "react";
import adminApi from "../../utils/adminApi";

interface InstructorOption { _id: string; name: string; }

const CertificateTemplateAssignment: React.FC<{ users: Array<{ _id: string; name: string; role: string }> }> = ({ users }) => {
  const instructors = useMemo(() => users.filter((user) => user.role.toLowerCase() === "instructor"), [users]);
  const [instructorId, setInstructorId] = useState("");
  const [title, setTitle] = useState("Certificate of Completion");
  const [subtitle, setSubtitle] = useState("This certificate is proudly presented to");
  const [accentColor, setAccentColor] = useState("#1d4ed8");
  const [signatureLabel, setSignatureLabel] = useState("Issued");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!instructorId) return setMessage("Select an instructor first.");
    setSaving(true);
    setMessage("");
    try {
      await adminApi.put(`/admin/instructors/${instructorId}/certificate-template`, {
        template: { title, subtitle, accentColor, signatureLabel },
      });
      setMessage("Certificate template assigned successfully.");
    } catch (error: any) {
      setMessage(error?.response?.data?.error || "Failed to assign certificate template.");
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 space-y-3">
      <h3 className="text-md font-semibold">Instructor Certificate Templates</h3>
      <p className="text-sm text-slate-500">Assign the design used when that instructor's learners complete a course.</p>
      <select value={instructorId} onChange={(event) => setInstructorId(event.target.value)} className="w-full rounded-md border p-2">
        <option value="">Select instructor</option>
        {instructors.map((instructor: InstructorOption) => <option key={instructor._id} value={instructor._id}>{instructor.name}</option>)}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Certificate title" className="rounded-md border p-2" />
        <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Certificate subtitle" className="rounded-md border p-2" />
        <label className="flex items-center gap-2 rounded-md border p-2 text-sm">Accent <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} /></label>
        <input value={signatureLabel} onChange={(event) => setSignatureLabel(event.target.value)} placeholder="Signature label" className="rounded-md border p-2" />
      </div>
      <button onClick={save} disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "Saving..." : "Assign Template"}</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
};

export default CertificateTemplateAssignment;