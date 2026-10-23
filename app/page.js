"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Carte({ titre, valeur, couleur }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 13, color: "#666" }}>{titre}</div>
      <div style={{ fontSize: 22, fontWeight: "bold", color: couleur || "#111" }}>{valeur}</div>
    </div>
  );
}

const LIENS = [
  ["/clients", "👥 Clients"],
  ["/services", "🧹 Services"],
  ["/employes", "👷 Employés"],
  ["/reservations", "📅 Réservations"],
  ["/factures", "🧾 Factures"],
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [prochaines, setProchaines] = useState([]);
  const [erreur, setErreur] = useState("");

  async function charger() {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(debutJour);
    finJour.setDate(finJour.getDate() + 1);
    const jourStr = debutJour.toLocaleDateString("sv-SE");

    const [clients, factures, aujourdhui, liste] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("factures").select("montant, paye, statut, date_echeance"),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .gte("date_debut", debutJour.toISOString())
        .lt("date_debut", finJour.toISOString())
        .neq("statut", "annule"),
      supabase
        .from("reservations")
        .select("id, date_debut, statut, clients(nom), services(nom), employes(nom)")
        .gte("date_debut", debutJour.toISOString())
        .neq("statut", "annule")
        .order("date_debut")
        .limit(6),
    ]);

    const err = clients.error || factures.error || aujourdhui.error || liste.error;
    if (err) setErreur(err.message);

    const fs = factures.data || [];
    const impayees = fs.filter((f) => f.statut !== "payee");
    setStats({
      clients: clients.count || 0,
      aujourdhui: aujourdhui.count || 0,
      reste: fs.reduce((t, f) => t + (f.montant - f.paye), 0),
      encaisse: fs.reduce((t, f) => t + f.paye, 0),
      nbImpayees: impayees.length,
      enRetard: impayees.filter((f) => f.date_echeance && f.date_echeance < jourStr).length,
    });
    setProchaines(liste.data || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else {
        setUser(data.session.user);
        charger();
      }
    });
  }, []);

  async function deconnexion() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const fcfa = (n) => (n || 0).toLocaleString("fr-FR") + " FCFA";
  const formatDate = (d) =>
    new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

  if (!user) return <p>Chargement...</p>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }}>Tableau de bord</h1>
      <small style={{ color: "#666" }}>{user.email}</small>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <Carte titre="Réservations aujourd'hui" valeur={stats.aujourdhui} />
          <Carte titre="Clients" valeur={stats.clients} />
          <Carte titre="Reste à encaisser" valeur={fcfa(stats.reste)} couleur="#c00" />
          <Carte titre="Total encaissé" valeur={fcfa(stats.encaisse)} couleur="green" />
          <Carte titre="Factures impayées" valeur={stats.nbImpayees} couleur="orange" />
          <Carte titre="En retard" valeur={stats.enRetard} couleur={stats.enRetard ? "#c00" : "#111"} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
        {LIENS.map(([href, label]) => (
          <a key={href} href={href} style={{ background: "#111", color: "#fff", textAlign: "center", padding: 14, borderRadius: 10, textDecoration: "none", fontSize: 16 }}>
            {label}
          </a>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Prochaines réservations</h3>
      {prochaines.length === 0 && <p>Aucune réservation à venir.</p>}
      {prochaines.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <strong>{r.clients?.nom}</strong> · {r.services?.nom}
          <div>{formatDate(r.date_debut)}</div>
          <div>👤 {r.employes?.nom || "Non affecté"} · {r.statut}</div>
        </div>
      ))}

      <button onClick={deconnexion} style={{ marginTop: 20 }}>Se déconnecter</button>
    </main>
  );
}
