"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const ENTREPRISE = {
  nom: "NOM DE L'ENTREPRISE",
  adresse: "Adresse, Dakar",
  telephone: "+221 00 000 00 00",
};

export default function Facture() {
  const { id } = useParams();
  const [f, setF] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      const { data: facture, error } = await supabase
        .from("factures")
        .select(
          "*, clients(nom, telephone, adresse), reservations(date_debut, date_fin, adresse, services(nom, type_tarif, prix))"
        )
        .eq("id", id)
        .single();
      if (error) setErreur(error.message);
      else setF(facture);
    });
  }, [id]);

  const fcfa = (n) => (n || 0).toLocaleString("fr-FR") + " FCFA";
  const date = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");

  if (erreur) return <p style={{ color: "red" }}>{erreur}</p>;
  if (!f) return <p>Chargement...</p>;

  const s = f.reservations?.services;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto" }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <a href="/factures">← Factures</a>{" "}
        <button onClick={() => window.print()} style={{ marginLeft: 12 }}>
          🖨️ Imprimer / PDF
        </button>
      </div>

      <h1 style={{ marginBottom: 0 }}>{ENTREPRISE.nom}</h1>
      <div>{ENTREPRISE.adresse}</div>
      <div>{ENTREPRISE.telephone}</div>

      <h2 style={{ marginTop: 32 }}>FACTURE {f.numero}</h2>
      <div>Date : {date(f.date_emission)}</div>
      {f.date_echeance && <div>Échéance : {date(f.date_echeance)}</div>}

      <h3 style={{ marginTop: 24 }}>Client</h3>
      <div>{f.clients?.nom}</div>
      <div>{f.clients?.adresse}</div>
      <div>{f.clients?.telephone}</div>

      <h3 style={{ marginTop: 24 }}>Prestation</h3>
      <div><strong>{s?.nom}</strong></div>
      {f.reservations?.date_debut && (
        <div>
          Du {date(f.reservations.date_debut)}
          {f.reservations.date_fin ? " au " + date(f.reservations.date_fin) : ""}
        </div>
      )}
      {f.reservations?.adresse && <div>Lieu : {f.reservations.adresse}</div>}

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ padding: 8, borderTop: "1px solid #000" }}>Total</td>
            <td style={{ padding: 8, borderTop: "1px solid #000", textAlign: "right" }}>
              <strong>{fcfa(f.montant)}</strong>
            </td>
          </tr>
          <tr>
            <td style={{ padding: 8 }}>Déjà payé</td>
            <td style={{ padding: 8, textAlign: "right" }}>{fcfa(f.paye)}</td>
          </tr>
          <tr>
            <td style={{ padding: 8, borderTop: "1px solid #000" }}>
              <strong>Reste à payer</strong>
            </td>
            <td style={{ padding: 8, borderTop: "1px solid #000", textAlign: "right" }}>
              <strong>{fcfa(f.montant - f.paye)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 32 }}>Merci pour votre confiance.</p>
    </main>
  );
}
