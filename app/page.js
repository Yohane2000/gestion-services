"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

function Compteur({ valeur, suffixe = "" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let debut;
    let raf;
    const duree = 900;
    function pas(t) {
      if (!debut) debut = t;
      const p = Math.min((t - debut) / duree, 1);
      setN(Math.round(valeur * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(pas);
    }
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [valeur]);
  return <>{n.toLocaleString("fr-FR")}{suffixe}</>;
}

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
        .in("statut", ["confirme", "en_cours"])
        .order("date_debut")
        .limit(6),
    ]);

    const err = clients.error || factures.error || aujourdhui.error || liste.error;
    if (err) setErreur(err.message);

    const fs = factures.data || [];
    const impayees = fs.filter((f) => f.statut !== "payee");
    const reste = fs.reduce((t, f) => t + (f.montant - f.paye), 0);
    const encaisse = fs.reduce((t, f) => t + f.paye, 0);
    setStats({
      clients: clients.count || 0,
      aujourdhui: aujourdhui.count || 0,
      reste,
      encaisse,
      facture: reste + encaisse,
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

  const h = new Date().getHours();
  const salut = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
  const dateJour = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const fcfa = (n) => (n || 0).toLocaleString("fr-FR") + " FCFA";
  const pct = stats && stats.facture > 0 ? Math.round((stats.encaisse / stats.facture) * 100) : 0;

  if (!user) return <p>Chargement…</p>;

  return (
    <main>
      <p className="date">{dateJour}</p>
      <h1>{salut} 👋</h1>
      {erreur && <p className="erreur">{erreur}</p>}

      {stats && (
        <>
          <section className="hero">
            <div className="hero-label">Reste à encaisser</div>
            <div className="hero-value">
              <Compteur valeur={stats.reste} suffixe=" FCFA" />
            </div>
            <div className="bar"><i style={{ width: pct + "%" }} /></div>
            <div className="hero-sub">
              {pct} % encaissé · {fcfa(stats.encaisse)} sur {fcfa(stats.facture)}
            </div>
          </section>

          <div className="grid2">
            <div className="tile">
              <span className="badge b1">📅</span>
              <b><Compteur valeur={stats.aujourdhui} /></b>
              <small>Réservations aujourd'hui</small>
            </div>
            <div className="tile" style={{ animationDelay: ".06s" }}>
              <span className="badge b2">👥</span>
              <b><Compteur valeur={stats.clients} /></b>
              <small>Clients</small>
            </div>
            <div className="tile" style={{ animationDelay: ".12s" }}>
              <span className="badge b3">⏳</span>
              <b><Compteur valeur={stats.nbImpayees} /></b>
              <small>Factures impayées</small>
            </div>
            <div className="tile" style={{ animationDelay: ".18s" }}>
              <span className="badge b4">⚠️</span>
              <b><Compteur valeur={stats.enRetard} /></b>
              <small>En retard</small>
            </div>
          </div>
        </>
      )}

      <div className="quick">
        <Link href="/reservations" className="pill">＋ Réservation</Link>
        <Link href="/clients" className="pill">＋ Client</Link>
        <Link href="/factures" className="pill">＋ Facture</Link>
      </div>

      <h3>Prochaines réservations</h3>
      {prochaines.length === 0 && <p className="vide">Aucune réservation à venir.</p>}
      {prochaines.map((r, i) => {
        const d = new Date(r.date_debut);
        return (
          <div key={r.id} className="res" style={{ animationDelay: i * 60 + "ms" }}>
            <div className="date-badge">
              <b>{d.getDate()}</b>
              <span>{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
            </div>
            <div className="res-info">
              <strong>{r.clients?.nom}</strong>
              <div>{r.services?.nom}</div>
              <small>
                🕐 {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · 👤{" "}
                {r.employes?.nom || "Non affecté"}
              </small>
            </div>
            <span className={"chip " + r.statut}>{r.statut.replace("_", " ")}</span>
          </div>
        );
      })}

      <button className="out" onClick={deconnexion}>Se déconnecter</button>
    </main>
  );
}
