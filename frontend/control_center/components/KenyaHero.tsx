import React from 'react'
import KenyanFlagBar from './KenyanFlagBar'
import Link from 'next/link'

export default function KenyanHero() {
  return (
    <section aria-label="Kenyan branding hero" className="bg-gradient-to-r from-green-900 to-emerald-900 text-white py-6">
      <KenyanFlagBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-start gap-2">
        <h2 className="text-2xl font-bold">KENYA OVERWATCH SYSTEM</h2>
        <p className="text-sm text-gray-200">Salama na Usalama — Safety first for all Kenyans</p>
        <div className="mt-2">
          <Link href="/" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
            Anza_dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
