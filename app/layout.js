export const metadata = { title: "Gestion Services" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: 16 }}>
        {children}
      </body>
    </html>
  );
}
