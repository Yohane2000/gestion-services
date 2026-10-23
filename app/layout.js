import "./globals.css";
import { Inter } from "next/font/google";
import Nav from "./Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gestion Services",
  description: "Clients, réservations et factures",
  appleWebApp: { capable: true, title: "Gestion", statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <Nav />
      </body>
    </html>
  );
}
