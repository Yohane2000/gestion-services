"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  async function seConnecter() {
    setErreur("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErreur("Email ou mot de passe incorrect.");
    else window.location.href = "/";
  }

  const champ = { display: "block", width: "100%", padding: 10, marginBottom: 12, fontSize: 16, boxSizing: "border-box" };

  return (
    <main style={{ maxWidth: 360, margin: "60px auto" }}>
      <h1>Connexion</h1>
      <input style={champ} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={champ} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button style={{ ...champ, background: "#111", color: "#fff" }} onClick={seConnecter}>
        Se connecter
      </button>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
    </main>
  );
}
