import "@midori/styles/globals.css";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="flex h-dvh max-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}