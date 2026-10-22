"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const POSTES = ["Agent de nettoyage", "Nounou", "Agent de sécurité", "Superviseur"];

export default function Employes() {
  const [employes, setEmployes] = useState([]);
  const [pret, setPret] = useState(false);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [poste, setPoste] = useState(POSTES[0]);
  const [erreur, setErreur] = useState("");

  async function charger() {
    const { data, error } = await supabase.from("employes").select("*").order("nom");
    if (error) setErreur(error.message);
    else setEmployes(data);
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
    const { error } = await supabase.from("employes").insert({ nom: nom.trim(), telephone, poste });
    if (error) {
      setErreur(error.message);
      return;
    }
    setNom("");
    setTelephone("");
    charger();
  }

  async function basculer(e) {
    const { error } = await supabase.from("employes").update({ actif: !e.actif }).eq("id", e.id);
    if (error) setErreur(error.message);
    else charger();
  }

  async function supprimer(id) {
    if (!confirm("Supprimer cet employé ?")) return;
    const { error } = await supabase.from("employes").delete().eq("id", id);
    if (error) setErreur("Impossible : cet employé a des réservations. Désactive-le plutôt.");
    else charger();
  }

  const champ = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };

  if (!pret) return <p>Chargement...</p>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <a href="/">← Accueil</a>
      <h1>Employés</h1>

      <input style={champ} placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
      <input style={champ} placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      <select style={champ} value={poste} onChange={(e) => setPoste(e.target.value)}>
        {POSTES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button style={{ ...champ, background: "#111", color: "#fff" }} onClick={ajouter}>
        Ajouter
      </button>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <h3>Équipe ({employes.length})</h3>
      {employes.map((e) => (
        <div key={e.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10, opacity: e.actif ? 1 : 0.5 }}>
          <strong>{e.nom}</strong> <small>({e.poste})</small>
          <div>{e.telephone}</div>
          <button onClick={() => basculer(e)} style={{ marginTop: 8, marginRight: 8 }}>
            {e.actif ? "Désactiver" : "Activer"}
          </button>
          <button onClick={() => supprimer(e.id)} style={{ marginTop: 8 }}>Supprimer</button>
        </div>
      ))}
    </main>
  );
}
