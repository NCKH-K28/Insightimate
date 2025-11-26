'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'boards', name: 'Boards' },
  { id: 'timeline', name: 'Timeline' },
  { id: 'reports', name: 'Reports' },
  { id: 'automation', name: 'Automation' },
]

const features = {
  boards: {
    title: 'Powerful agile boards',
    items: [
      'Scrum boards: Scrum boards help agile teams break large, complex projects into manageable pieces of work so focused teams ship faster.',
      'Kanban boards: Agile and DevOps teams can use flexible kanban boards to visualize workflows, limit work-in-progress, and maximize efficiency as a team. Templates make it easy to get started quickly and customize as you go.',
      'Choose your own adventure: Jira is flexible enough to mold to your team\'s own unique way of working, whether it is Scrum, Kanban, or something in between.',
    ],
    image: 'https://res.cloudinary.com/dh41tyuha/image/upload/v1763124303/Screenshot_from_2025-11-14_21-44-19_iprilq.png',
  },
  timeline: {
    title: 'Stay on track – even when the track changes',
    description: 'Use the timeline view to map out the big picture, communicate updates to stakeholders, and ensure your team stays on the same page.',
    image: 'https://res.cloudinary.com/dh41tyuha/image/upload/v1763124622/Screenshot_from_2025-11-14_21-50-05_g1v9lm.png',
  },
  reports: {
    title: 'Real-time insights',
    description: 'Get comprehensive reports and analytics to track your team\'s progress and make data-driven decisions.',
    image: 'https://res.cloudinary.com/dh41tyuha/image/upload/v1763124517/Screenshot_from_2025-11-14_21-48-18_yxdcgv.png',
  },
  automation: {
    title: 'Automate your workflow',
    description: 'Set up, clean up, and automate even the most complicated project workflows.',
    image: 'https://res.cloudinary.com/dh41tyuha/image/upload/v1763124517/Screenshot_from_2025-11-14_21-48-18_yxdcgv.png',
  },
}

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState('boards')

  return (
    <section className="w-full py-20 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-gray-900 mb-12"
        >
          Discover the features that make Insightimate so easy to use
        </motion.h2>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Feature Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-3xl font-bold text-blue-600 mb-6">
              {features[activeTab as keyof typeof features].title}
            </h3>
            {activeTab === 'boards' ? (
              <ul className="space-y-4">
                {features.boards.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 text-xl mt-1">✓</span>
                    <p className="text-gray-700 leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 leading-relaxed text-lg">
                {'description' in features[activeTab as keyof typeof features]
                  ? (features[activeTab as keyof typeof features] as { description: string }).description
                  : ''}
              </p>
            )}
          </motion.div>

          <motion.div
            key={`visual-${activeTab}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-xl overflow-hidden"
          >
            {(features[activeTab as keyof typeof features] as any).image ? (
              <img
                src={(features[activeTab as keyof typeof features] as any).image}
                alt={features[activeTab as keyof typeof features].title}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg">Feature visualization</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
