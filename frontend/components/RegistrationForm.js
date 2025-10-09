"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SocialLoginButtons from "./SocialLoginButtons";

const roles = [
  { value: "student", label: "Student" },
  { value: "landlord", label: "Landlord" },
  { value: "agent", label: "Agent" },
];

const initialForm = {
  role: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  re_password: "",
  phone: "",
  university: "",
  student_id: "",
  national_id: "",
  campus_region: "",
};

const validateForm = (form) => {
  const errors = [];
  if (form.password !== form.re_password) {
    errors.push("Passwords do not match");
  }
  if (form.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  return errors;
};

const ProgressTracker = ({ steps }) => (
  <div className="flex gap-2 mb-4">
    {steps.map((step, idx) => (
      <span
        key={idx}
        className={`px-2 py-1 rounded text-xs ${
          step.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {step.label}
      </span>
    ))}
  </div>
);

export default function RegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState([
    { label: "Role", done: false },
    { label: "Details", done: false },
    { label: "Verification", done: false },
    { label: "Profile", done: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    const updated = progress.map((p, idx) =>
      idx === step ? { ...p, done: true } : p
    );
    setProgress(updated);
    setStep(step + 1);
  };

  const renderFields = () => {
    if (step === 0) {
      return (
        <div>
          <label className="block mb-2 font-medium">Select Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4"
            required
          >
            <option value="">-- Choose --</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div>
          <label className="block mb-2 font-medium">First Name</label>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />

          <label className="block mb-2 font-medium">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />

          <label className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />

          <label className="block mb-2 font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
            minLength={8}
          />

          <label className="block mb-2 font-medium">Confirm Password</label>
          <input
            type="password"
            name="re_password"
            value={form.re_password}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
            minLength={8}
          />

          <label className="block mb-2 font-medium">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />
        </div>
      );
    }

    if (step === 2) {
      if (form.role === "student") {
        return (
          <div>
            <label className="block mb-2 font-medium">University</label>
            <input
              type="text"
              name="university"
              value={form.university}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-2"
              required
            />

            <label className="block mb-2 font-medium">Student ID</label>
            <input
              type="text"
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-2"
              required
            />

            <label className="block mb-2 font-medium">Campus Region</label>
            <input
              type="text"
              name="campus_region"
              value={form.campus_region}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-2"
              required
            />
          </div>
        );
      }

      if (form.role === "landlord" || form.role === "agent") {
        return (
          <div>
            <label className="block mb-2 font-medium">National ID</label>
            <input
              type="text"
              name="national_id"
              value={form.national_id}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-2"
              required
            />
          </div>
        );
      }
    }

    if (step === 3) {
      return (
        <div>
          <p className="mb-2">You can also sign up quickly using:</p>
          <SocialLoginButtons />
        </div>
      );
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords
    const validationErrors = validateForm(form);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Registration failed");
      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 animate-fade-in"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-700 tracking-tight">
        Create your Homebase account
      </h1>

      <ProgressTracker steps={progress} />

      <div className="transition-all duration-300 ease-in-out">
        {renderFields()}
      </div>

      {error && (
        <div className="text-red-600 mb-2 text-center font-semibold animate-shake">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {step > 0 && (
          <button
            type="button"
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg shadow transition-all duration-200"
            onClick={() => setStep(step - 1)}
          >
            ← Back
          </button>
        )}

        {step < progress.length - 1 && (
          <button
            type="button"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all duration-200"
            onClick={nextStep}
          >
            Next →
          </button>
        )}

        {step === progress.length - 1 && (
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-t-2 border-green-200 border-t-green-600 rounded-full inline-block"></span>
                Registering...
              </span>
            ) : (
              "Register"
            )}
          </button>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline font-medium">
          Sign In
        </a>
      </div>
    </form>
  );
}
