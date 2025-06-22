import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LIMINA | Conditional Buy Orders for E-commerce',
  description: 'LIMINA: The buy order checkout service that lets shoppers commit to purchase when conditions are met. Revolutionary conditional commerce for retail and B2B.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: 'Poppins, sans-serif' }}>{children}</body>
    </html>
  )
}