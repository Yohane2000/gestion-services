"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// À personnaliser
const NOM_ENTREPRISE = "NOM DE L'ENTREPRISE";
const INDICATIF = "221"; // indicatif pays ajouté aux numéros à 9 chiffres

function numeroWhatsApp(tel) {
  let n = (tel || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("00")) return n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  return n.length <= 9 ? INDICATIF + n : n;
}

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [pret, setPret] = useState(false);
  const [reservationId, setReservationId] = useState("");
  const [montant, setMontant] = useState("");
  const [echeance, setEcheance] = useState("");
  const [filtre, setFiltre] = useState("toutes");
  const [erreur, setErreur] = useState("");

  async function charger() {
    const [f, r] = await Promise.all([
      supabase
        .from("factures")
        .select("*, clients(nom, telephone), reservations(services(nom))")
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

  async function marquerRelance(id) {
    const { error } = await supabase
      .from("factures")
      .update({ derniere_relance: new Date().toISOString() })
      .eq("id", id);
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
  const dateFr = (d) => new Date(d).toLocaleDateString("fr-FR");
  const jourStr = new Date().toLocaleDateString("sv-SE");
  const enRetard = (f) => f.statut !== "payee" && f.date_echeance && f.date_echeance < jourStr;
  const visibles = filtre === "impayees" ? factures.filter((f) => f.statut !== "payee") : factures;

  function lienWhatsApp(f) {
    const reste = f.montant - f.paye;
    const ech = f.date_echeance ? ` (échéance : ${dateFr(f.date_echeance)})` : "";
    const message =
      `Bonjour ${f.clients?.nom},\n\n` +
      `Petit rappel concernant la facture ${f.numero} : il reste ${fcfa(reste)} à régler${ech}.\n\n` +
      `Merci de bien vouloir procéder au règlement. N'hésitez pas à nous contacter pour toute question.\n\n` +
      `Cordialement,\n${NOM_ENTREPRISE}`;
    return `https://wa.me/${numeroWhatsApp(f.clients?.telephone)}?text=${encodeURIComponent(message)}`;
  }

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

      <h3>Liste ({visibles.length})</h3>
      <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={{ marginBottom: 12 }}>
        <option value="toutes">Toutes les factures</option>
        <option value="impayees">À relancer (impayées)</option>
      </select>

      {visibles.map((f) => {
        const tel = numeroWhatsApp(f.clients?.telephone);
        return (
          <div key={f.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <strong>{f.numero}</strong> · {f.clients?.nom}
            <div><small>{f.reservations?.services?.nom}</small></div>
            <div>Total : {fcfa(f.montant)}</div>
            <div>Payé : {fcfa(f.paye)} · Reste : {fcfa(f.montant - f.paye)}</div>
            <div style={{ color: couleur[f.statut], fontWeight: "bold" }}>{f.statut}</div>
            {f.date_echeance && <div><small>Échéance : {dateFr(f.date_echeance)}</small></div>}
            {enRetard(f) && <div style={{ color: "#c00", fontWeight: 600 }}>⚠️ En retard</div>}
            {f.derniere_relance && <div><small>Dernière relance : {dateFr(f.derniere_relance)}</small></div>}

            <div style={{ marginTop: 8 }}>
              <a href={`/factures/${f.id}`}>🖨️ Voir / imprimer</a>
            </div>

            {f.statut !== "payee" &&
              (tel ? (
                <div style={{ marginTop: 10 }}>
                  <a
                    href={lienWhatsApp(f)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => marquerRelance(f.id)}
                    style={{ display: "inline-block", background: "#25D366", color: "#fff", padding: "10px 15px", borderRadius: 11 }}
                  >
                    💬 Relancer sur WhatsApp
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}><small>📵 Pas de numéro pour ce client</small></div>
              ))}

            {f.statut !== "payee" && (
              <button onClick={() => paiement(f)} style={{ marginTop: 8, marginRight: 8 }}>
                Enregistrer un paiement
              </button>
            )}
            <button onClick={() => supprimer(f.id)} style={{ marginTop: 8 }}>Supprimer</button>
          </div>
        );
      })}
    </main>
  );
}
