"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const STATUTS = ["confirme", "en_cours", "termine", "annule"];

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [pret, setPret] = useState(false);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [employeId, setEmployeId] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [adresse, setAdresse] = useState("");
  const [erreur, setErreur] = useState("");

  async function charger() {
    const [c, s, e, r] = await Promise.all([
      supabase.from("clients").select("id, nom").order("nom"),
      supabase.from("services").select("id, nom").eq("actif", true).order("nom"),
      supabase.from("employes").select("id, nom").eq("actif", true).order("nom"),
      supabase
        .from("reservations")
        .select("*, clients(nom), services(nom), employes(nom)")
        .order("date_debut", { ascending: true }),
    ]);
    if (c.data) setClients(c.data);
    if (s.data) setServices(s.data);
    if (e.data) setEmployes(e.data);
    if (r.data) setReservations(r.data);
    const err = c.error || s.error || e.error || r.error;
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

  async function ajouter() {
    if (!clientId || !serviceId || !debut) {
      setErreur("Choisis au moins un client, un service et une date de début.");
      return;
    }
    setErreur("");
    const { error } = await supabase.from("reservations").insert({
      client_id: clientId,
      service_id: serviceId,
      employe_id: employeId || null,
      date_debut: new Date(debut).toISOString(),
      date_fin: fin ? new Date(fin).toISOString() : null,
      adresse,
    });
    if (error) {
      setErreur(error.message);
      return;
    }
    setDebut("");
    setFin("");
    setAdresse("");
    charger();
  }

    async function changerStatut(id, statut) {
    if (
      statut === "termine" &&
      !confirm("Marquer comme terminée ? Cette action est irréversible.")
    )
      return;
    const { error } = await supabase.from("reservations").update({ statut }).eq("id", id);
    if (error) setErreur(error.message);
    else charger();
  }


  async function supprimer(id) {
    if (!confirm("Supprimer cette réservation ?")) return;
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) setErreur(error.message);
    else charger();
  }

  const champ = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };
  const champDate = { ...champ, WebkitAppearance: "none", appearance: "none", minWidth: 0, maxWidth: "100%", height: 44, border: "1px solid #ddd", borderRadius: 6 };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "";

  if (!pret) return <p>Chargement...</p>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <a href="/">← Accueil</a>
      <h1>Réservations</h1>

      <h3>Nouvelle réservation</h3>
      <select style={champ} value={clientId} onChange={(e) => setClientId(e.target.value)}>
        <option value="">— Client —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.nom}</option>
        ))}
      </select>
      <select style={champ} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
        <option value="">— Service —</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.nom}</option>
        ))}
      </select>
      <select style={champ} value={employeId} onChange={(e) => setEmployeId(e.target.value)}>
        <option value="">— Employé (optionnel) —</option>
        {employes.map((e) => (
          <option key={e.id} value={e.id}>{e.nom}</option>
        ))}
      </select>
      <label>Début</label>
      <input style={champDate} type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} />
      <label>Fin (optionnel)</label>
      <input style={champDate} type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
      <input style={champ} placeholder="Adresse de la prestation" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      <button style={{ ...champ, background: "#111", color: "#fff" }} onClick={ajouter}>
        Réserver
      </button>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <h3>Planning ({reservations.length})</h3>
      {reservations.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <strong>{r.clients?.nom}</strong> · {r.services?.nom}
          <div>{formatDate(r.date_debut)}{r.date_fin ? " → " + formatDate(r.date_fin) : ""}</div>
          <div>👤 {r.employes?.nom || "Non affecté"}</div>
          <div>📍 {r.adresse}</div>
          <select value={r.statut} onChange={(e) => changerStatut(r.id, e.target.value)} style={{ marginTop: 8, marginRight: 8, fontSize: 16 }}>
            {STATUTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => supprimer(r.id)}>Supprimer</button>
        </div>
      ))}
    </main>
  );
}

