"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/account/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-stone-500 hover:text-amber-800 transition"
    >
      Sign Out
    </button>
  );
}
