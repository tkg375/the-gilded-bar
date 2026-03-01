import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";

export default async function AccountProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (!token || !(await verifyCustomerToken(token))) {
    redirect("/account/login");
  }
  return <>{children}</>;
}
