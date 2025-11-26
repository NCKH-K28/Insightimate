'use client'

import { motion } from 'framer-motion'

export default function SpreadsheetSection() {
  return (
    <section className="w-full py-20 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Task Detail View */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
              <img
                src="https://res.cloudinary.com/dh41tyuha/image/upload/v1763124881/Screenshot_from_2025-11-14_21-54-26_emvinz.png"
                alt="Jira task detail"
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Right - Marketing Text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-5xl font-bold text-blue-600 mb-6 leading-tight">
              Bye-bye, spreadsheets
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed">
              Keep every detail of a project centralized in real time so up-to-date info can flow freely across people, teams, and tools.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

