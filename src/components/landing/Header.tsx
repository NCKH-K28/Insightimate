'use client'

import { useState } from 'react'

const teams = [
  { id: 'software', name: 'Software', icon: '💻', color: 'bg-purple-500' },
  { id: 'operations', name: 'Operations', icon: '⚙️', color: 'bg-purple-500' },
  { id: 'hr', name: 'HR', icon: '👤', color: 'bg-orange-500' },
  { id: 'all', name: 'All Teams', icon: '🔷', color: 'bg-blue-500' },
  { id: 'marketing', name: 'Marketing', icon: '📢', color: 'bg-purple-500' },
  { id: 'design', name: 'Design', icon: '🎨', color: 'bg-yellow-500' },
  { id: 'sales', name: 'Sales', icon: '📊', color: 'bg-red-500' },
]

export default function Header() {
  const [selectedTeam, setSelectedTeam] = useState('all')

  return (
    <header className="w-full py-6 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center mr-2">
            <span className="text-gray-300 font-bold text-lg">I</span>
          </div>
          <span className="text-2xl font-semibold text-gray-900">Insightimate</span>
        </div>      
      </div>
    </header>
  )
}


