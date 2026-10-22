"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [pret, setPret] = useState(false);
  const [reservationId, setReservationId] = useState("");
  const [montant, setMontant] = useState("");
  const [echeance, setEcheance] = useState("");
  const [erreur, setErreur] = useState("");

  async function charger() {
    const [f, r] = await Promise.all([
      supabase
        .from("factures")
        .select("*, clients(nom), reservations(services(nom))")
        .order("date_emission", { ascending: false }),
      supabase
        .from("reservations")
        .select("id, client_id, date_debut, clients(nom), services(nom, prix)")
        .order("date_debut", { ascending: false }),
    ]);
    if (f.data) setFactures(f.data);
    if (r.data) setReservations(r.data);
    const err = f.error || r.error;
    if (err) setErreur(err.message);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else {
        setPret(true);
        charger();
      }
    });
  }, []);

  function choisirReservation(id) {
    setReservationId(id);
    const r = reservations.find((x) => x.id === id);
    if (r?.services?.prix) setMontant(String(r.services.prix));
  }

  async function ajouter() {
    const r = reservations.find((x) => x.id === reservationId);
    if (!r || !montant) {
      setErreur("Choisis une réservation et un montant.");
      return;
    }
    setErreur("");
    const max = factures.reduce(
      (m, f) => Math.max(m, parseInt((f.numero || "").split("-").pop(), 10) || 0),
      0
    );
    const numero = `F-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("factures").insert({
      client_id: r.client_id,
      reservation_id: r.id,
      numero,
      montant: parseInt(montant, 10),
      date_echeance: echeance || null,
    });
    if (error) {
      setErreur(error.message);
      return;
    }
    setReservationId("");
    setMontant("");
    setEcheance("");
    charger();
  }

  async function paiement(f) {
    const reste = f.montant - f.paye;
    const saisie = prompt(`Montant reçu en FCFA (reste ${reste}) :`);
    const m = parseInt(saisie, 10);
    if (!m || m <= 0) return;
    const paye = Math.min(f.paye + m, f.montant);
    const statut = paye >= f.montant ? "payee" : "partielle";
    const { error } = await supabase.from("factures").update({ paye, statut }).eq("id", f.id);
    if (error) setErreur(error.message);
    else charger();
  }

  async function supprimer(id) {
    if (!confirm("Supprimer cette facture ?")) return;
    const { error } = await supabase.from("factures").delete().eq("id", id);
    if (error) setErreur(error.message);
    else charger();
  }

  const champ = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };
  const couleur = { payee: "green", partielle: "orange", impayee: "red" };
  const fcfa = (n) => (n || 0).toLocaleString("fr-FR") + " FCFA";

  if (!pret) return <p>Chargement...</p>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <a href="/">← Accueil</a>
      <h1>Factures</h1>

      <h3>Nouvelle facture</h3>
      <select style={champ} value={reservationId} onChange={(e) => choisirReservation(e.target.value)}>
        <option value="">— Réservation —</option>
        {reservations.map((r) => (
          <option key={r.id} value={r.id}>
            {r.clients?.nom} · {r.services?.nom} · {new Date(r.date_debut).toLocaleDateString("fr-FR")}
          </option>
        ))}
      </select>
      <input style={champ} type="number" inputMode="numeric" placeholder="Montant en FCFA" value={montant} onChange={(e) => setMontant(e.target.value)} />
      <label>Échéance (optionnel)</label>
      <input
        style={{ ...champ, WebkitAppearance: "none", appearance: "none", minWidth: 0, maxWidth: "100%", height: 44, border: "1px solid #ddd", borderRadius: 6 }}
        type="date"
        value={echeance}
        onChange={(e) => setEcheance(e.target.value)}
      />
      <button style={{ ...champ, background: "#111", color: "#fff" }} onClick={ajouter}>
        Créer la facture
      </button>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <h3>Liste ({factures.length})</h3>
      {factures.map((f) => (
        <div key={f.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <strong>{f.numero}</strong> · {f.clients?.nom}
          <div><small>{f.reservations?.services?.nom}</small></div>
          <div>Total : {fcfa(f.montant)}</div>
          <div>Payé : {fcfa(f.paye)} · Reste : {fcfa(f.montant - f.paye)}</div>
          <div style={{ color: couleur[f.statut], fontWeight: "bold" }}>{f.statut}</div>
          {f.date_echeance && <div><small>Échéance : {new Date(f.date_echeance).toLocaleDateString("fr-FR")}</small></div>}
                    <div style={{ marginTop: 8 }}>
            <a href={`/factures/${f.id}`}>🖨️ Voir / imprimer</a>
          </div>

          {f.statut !== "payee" && (
            <button onClick={() => paiement(f)} style={{ marginTop: 8, marginRight: 8 }}>
              Enregistrer un paiement
            </button>
          )}
          <button onClick={() => supprimer(f.id)} style={{ marginTop: 8 }}>Supprimer</button>
        </div>
      ))}
    </main>
  );
}
