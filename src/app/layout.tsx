import "./globals.css";
export const metadata = { title: "EcoManage — Integrated Waste Management System" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body className="text-gray-800 antialiased">{children}</body></html>);
}
