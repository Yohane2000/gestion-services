"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/", "🏠", "Accueil"],
  ["/clients", "👥", "Clients"],
  ["/services", "🧹", "Services"],
  ["/employes", "👷", "Équipe"],
  ["/reservations", "📅", "Planning"],
  ["/factures", "🧾", "Factures"],
];

export default function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <nav className="tabbar">
      {TABS.map(([href, icone, label]) => {
        const actif = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={"tab" + (actif ? " actif" : "")}>
            <span className="ico">{icone}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
