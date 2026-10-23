"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function seConnecter() {
    setErreur("");
    setChargement(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setChargement(false);
    if (error) {
      setErreur(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message
      );
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="logo">✨</div>
        <h1>Connexion</h1>
        <p className="sous">Accédez à votre espace de gestion.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && seConnecter()}
        />
        <button className="btn" onClick={seConnecter} disabled={chargement}>
          {chargement ? "Connexion…" : "Se connecter"}
        </button>
        {erreur && <p className="erreur" style={{ marginTop: 14 }}>{erreur}</p>}
      </div>
    </div>
  );
}
