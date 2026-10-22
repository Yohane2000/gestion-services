"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else setUser(data.session.user);
    });
  }, []);

  async function deconnexion() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!user) return <p>Chargement...</p>;

  return (
    <main>
  
      <h1>Gestion Services</h1>
      <p>Connecté : {user.email}</p>
                  <p><a href="/clients">👥 Clients</a></p>
                  <p><a href="/services">🧹 Services</a></p>
                  <p><a href="/employes">👷 Employés</a></p>
                  <p><a href="/reservations">📅 Réservations</a></p>

      <button onClick={deconnexion}>Se déconnecter</button>

    </main>
  );
}
