// src/pages/Certificate.tsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import api from "../utils/api";

interface CertificateRecord {
  id: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  issueDate: string;
  certificationUrl: string;
}

const Certificate: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  // If we just came from passing the final assessment, the result (including
  // the freshly-issued certificate) is handed over via navigation state, so
  // we can render immediately without an extra round trip.
  const passedCertificate = (location.state as any)?.certificate as { id: string; fileUrl?: string; issuedAt?: string } | undefined;

  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(!passedCertificate);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (passedCertificate) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const resp = await api.get("/students/certificates");
        const found = (resp.data || []).find((c: CertificateRecord) => String(c.courseId) === String(courseId));
        if (found) {
          setCertificate(found);
        } else {
          setError("No certificate found for this course yet. Complete the final assessment to earn one.");
        }
      } catch (err: any) {
        console.error("Failed to load certificate", err);
        setError(err?.response?.data?.error || "Failed to load your certificate.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, passedCertificate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full text-center">
        {loading && <p className="text-gray-500">Loading your certificate…</p>}
        {!loading && error && (
          <>
            <p className="text-red-500 mb-4">{error}</p>
            <Link to={`/courses/${courseId}`} className="text-blue-600 underline">
              Back to course
            </Link>
          </>
        )}
        {!loading && !error && (
          <>
            <h2 className="text-2xl font-bold mb-2">🎉 Congratulations!</h2>
            <p className="mb-6">
              You've successfully completed{" "}
              <strong>{certificate?.courseName || "this course"}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Issued {new Date(certificate?.issueDate || passedCertificate?.issuedAt || Date.now()).toLocaleDateString()}
            </p>
            <div className="flex justify-center gap-3">
              {(certificate?.certificationUrl || passedCertificate?.fileUrl) && (
                <a
                  href={certificate?.certificationUrl || passedCertificate?.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Download Certificate
                </a>
              )}
              <button onClick={() => window.print()} className="px-4 py-2 border rounded">
                Print
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Certificate;
