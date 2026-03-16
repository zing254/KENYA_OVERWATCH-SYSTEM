import React from 'react'

// Simple, ASCII-friendly Kenyan footer with branding and year
export default function KenyaFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-8 border-t border-gray-700 pt-4 text-sm text-gray-400" aria-label="Kenya Overwatch footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>© {year} Kenya Overwatch System • Harambee</div>
        <div>Made in Kenya • Nairobi</div>
      </div>
    </footer>
  )
}
