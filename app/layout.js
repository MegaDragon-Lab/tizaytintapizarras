import './globals.css';
export const metadata = {
  title: 'Tiza & Tinta — Pizarras',
  description: 'Arte original sobre pizarra, hecho a mano.',
};
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
