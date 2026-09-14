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
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-3xl">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" role="status" aria-live="polite">
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="mx-auto h-10 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="mx-auto h-4 w-1/2 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="mt-8 h-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
            <p className="mt-6 text-center text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Loading your certificate...</p>
          </div>
        )}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-950/30">
            <h1 className="text-lg font-semibold leading-7 text-red-900 dark:text-red-200">Certificate unavailable</h1>
            <p className="mt-2 text-sm font-normal leading-5 text-red-800 dark:text-red-300">{error}</p>
            <Link to={`/courses/${courseId}`} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium leading-5 text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
              Back to course
            </Link>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="text-center">
              <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Certificate earned</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Congratulations</h1>
              <p className="mx-auto mt-3 max-w-xl text-base font-normal leading-6 text-slate-600 dark:text-slate-400">
                You have successfully completed <span className="font-semibold text-slate-950 dark:text-slate-50">{certificate?.courseName || "this course"}</span>.
              </p>
            </div>

            <article className="mt-8 rounded-xl border border-indigo-200 bg-white p-6 text-center shadow-sm dark:border-indigo-500/30 dark:bg-slate-900 sm:p-10" aria-label="Certificate preview">
              <div className="border border-dashed border-indigo-300 px-6 py-10 dark:border-indigo-500/40 sm:px-12">
                <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Arodonna ICT Arena</p>
                <h2 className="mt-6 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Certificate of Completion</h2>
                <p className="mt-6 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">This certifies that</p>
                <p className="mt-2 text-2xl font-semibold leading-8 text-slate-950 dark:text-slate-50">{certificate?.courseName || "Course Graduate"}</p>
                <p className="mx-auto mt-6 max-w-lg text-base font-normal leading-6 text-slate-600 dark:text-slate-400">has successfully completed the requirements for this course.</p>
                <div className="mx-auto mt-8 h-px max-w-xs bg-slate-200 dark:bg-slate-800" />
                <p className="mt-4 text-xs font-medium leading-4 text-slate-500 dark:text-slate-400">
                  Issued {new Date(certificate?.issueDate || passedCertificate?.issuedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </article>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {(certificate?.certificationUrl || passedCertificate?.fileUrl) && (
                <a
                  href={certificate?.certificationUrl || passedCertificate?.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium leading-5 text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                >
                  Download certificate PDF
                </a>
              )}
              <button onClick={() => window.print()} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-6 text-sm font-medium leading-5 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950">
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
