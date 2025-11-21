"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

const verificationSteps = [
  { label: "Upload ID", key: "id" },
  { label: "Upload Proof of Property", key: "property" },
  { label: "Admin/Agent Approval", key: "approval" },
];

export default function VerificationForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState([false, false, false]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const { data: session } = useSession();

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file before uploading.");
      return;
    }

    setLoading(true);
    setError("");

    const type = step === 0 ? "student_id" : "property_proof";
    const formData = new FormData();
    formData.append("document", file);
    formData.append("verification_type", type);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verifications/`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const updated = [...status];
      updated[step] = true;
      setStatus(updated);
      setFile(null);

      if (step < verificationSteps.length - 1) {
        setStep(step + 1);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white p-8 rounded shadow-md w-full max-w-md">
      {/* Steps display */}
      <div className="flex gap-2 mb-4">
        {verificationSteps.map((s, idx) => (
          <span
            key={s.key}
            className={`px-2 py-1 rounded text-xs ${
              status[idx]
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Errors */}
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Step content */}
      {step === 0 && (
        <div>
          <label className="block mb-2 font-medium">Upload ID Document</label>
          <input
            type="file"
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <label className="block mb-2 font-medium">
            Upload Proof of Property
          </label>
          <input
            type="file"
            className="w-full p-2 border rounded mb-2"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="mb-2">Waiting for Admin/Agent approval...</p>
          <button
            type="button"
            className="px-4 py-2 bg-gray-400 text-white rounded"
            disabled
          >
            Pending
          </button>
        </div>
      )}
    </form>
  );
}
