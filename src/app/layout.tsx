import "./globals.css";
import React from "react";

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={"bg-charleston-green text-foreground-bright-gray"}>
        {children}
      </body>
    </html>
  );
}
