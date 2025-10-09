import { signIn } from "next-auth/react";

export default function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-2 my-4">
      <button type="button" className="w-full py-2 bg-red-500 text-white rounded" onClick={() => signIn("google")}>Sign in with Google</button>
      <button type="button" className="w-full py-2 bg-blue-800 text-white rounded" onClick={() => signIn("facebook")}>Sign in with Facebook</button>
      <button type="button" className="w-full py-2 bg-gray-800 text-white rounded" onClick={() => signIn("github")}>Sign in with GitHub</button>
    </div>
  );
}
