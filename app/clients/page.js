"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [pret, setPret] = useState(false);
  const [nom, setNom] = useState("");
  const [type, setType] = useState("particulier");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [erreur, setErreur] = useState("");

  async function charger() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErreur(error.message);
    else setClients(data);
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
    if (!nom.trim()) return;
    setErreur("");
    const { error } = await supabase
      .from("clients")
      .insert({ nom: nom.trim(), type, telephone, adresse });
    if (error) {
      setErreur(error.message);
      return;
    }
    setNom("");
    setTelephone("");
    setAdresse("");
    charger();
  }

  async function supprimer(id) {
    if (!confirm("Supprimer ce client et ses réservations et factures ?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) setErreur(error.message);
    else charger();
  }

  const champ = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };

  if (!pret) return <p>Chargement...</p>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <a href="/">← Accueil</a>
      <h1>Clients</h1>

      <h3>Nouveau client</h3>
      <input style={champ} placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
      <select style={champ} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="particulier">Particulier</option>
        <option value="entreprise">Entreprise</option>
      </select>
      <input style={champ} placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      <input style={champ} placeholder="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      <button style={{ ...champ, background: "#111", color: "#fff" }} onClick={ajouter}>
        Ajouter
      </button>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <h3>Liste ({clients.length})</h3>
      {clients.map((c) => (
        <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <strong>{c.nom}</strong> <small>({c.type})</small>
          <div>{c.telephone}</div>
          <div>{c.adresse}</div>
          <button onClick={() => supprimer(c.id)} style={{ marginTop: 8 }}>
            Supprimer
          </button>
        </div>
      ))}
    </main>
  );
}
