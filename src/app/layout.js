import { Inter } from "next/font/google";
import "./globals.css"; // Ensure you have your global styles imported
import Providers from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mind Namo Admin",
  description: "Admin Portal for Mind Namo Platform",
};

export default async function RootLayout({ children }) {
  // Fetch session on the server to pass to the client provider
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}