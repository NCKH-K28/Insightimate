'use client'

import { motion } from 'framer-motion'
import SignIn_UpForm from './SignIn_UpForm'
import KanbanBoard from './KanbanBoard'

export default function HeroSection() {
  return (
    <section className="w-full py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Sign Up Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SignIn_UpForm />
          </motion.div>

          {/* Right Side - Kanban Board */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <KanbanBoard />
          </motion.div>
        </div>
      </div>
    </section>
  )
}


