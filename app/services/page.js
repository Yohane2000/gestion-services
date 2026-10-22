"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = [
  "Nettoyage industriel",
  "Nettoyage ménager",
  "Baby-sitting",
  "Sécurité résidentielle",
  "Sécurité industrielle",
];
const TARIFS = ["forfait", "heure", "jour", "mois"];

export default function Services() {
  const [services, setServices] = useState([]);
  const [pret, setPret] = useState(false);
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0]);
  const [typeTarif, setTypeTarif] = useState("forfait");
  const [prix, setPrix] = useState("");
  const [erreur, setErreur] = useState("");

  async function charger() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("categorie");
    if (error) setErreur(error.message);
    else setServices(data);
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
    if (!nom.trim() || !prix) return;
    setErreur("");
    const { error } = await supabase.from("services").insert({
      nom: nom.trim(),
      categorie,
      type_tarif: typeTarif,
      prix: parseInt(prix, 10),
    });
    if (error) {
      setErreur(error.message);
      return;
    }
    setNom("");
    setPrix("");
    charger();
  }

  async function basculer(s) {
    const { error } = await supabase
      .from("services")
      .update({ actif: !s.actif })
      .eq("id", s.id);
    if (error) setErreur(error.message);
    else charger();
  }

  async function supprimer(id) {
    if (!confirm("Supprimer ce service ?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error)
      setErreur("Impossible : ce service est déjà utilisé. Désactive-le plutôt.");
    else charger();
  }

  const champ = { display: "block", width: "100%", padding: 10, marginBottom: 10, fontSize: 16, boxSizing: "border-box" };

  if (!pret) return <p>Chargement...</p>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <a href="/">← Accueil</a>
      <h1>Services</h1>

      <h3>Nouveau service</h3>
      <input style={champ} placeholder="Nom (ex : Ménage 4h)" value={nom} onChange={(e) => setNom(e.target.value)} />
      <select style={champ} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select style={champ} value={typeTarif} onChange={(e) => setTypeTarif(e.target.value)}>
        {TARIFS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input style={champ} type="number" inputMode="numeric" placeholder="Prix en FCFA" value={prix} onChange={(e) => setPrix(e.target.value)} />
      <button style={{ ...champ, background: "#111", color: "#fff" }} onClick={ajouter}>
        Ajouter
      </button>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <h3>Catalogue ({services.length})</h3>
      {services.map((s) => (
        <div key={s.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10, opacity: s.actif ? 1 : 0.5 }}>
          <strong>{s.nom}</strong>
          <div><small>{s.categorie}</small></div>
          <div>{s.prix.toLocaleString("fr-FR")} FCFA / {s.type_tarif}</div>
          <button onClick={() => basculer(s)} style={{ marginTop: 8, marginRight: 8 }}>
            {s.actif ? "Désactiver" : "Activer"}
          </button>
          <button onClick={() => supprimer(s.id)} style={{ marginTop: 8 }}>
            Supprimer
          </button>
        </div>
      ))}
    </main>
  );
}
