'use client'

import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import WorkflowSection from '@/components/landing/WorkflowSection'
import SpreadsheetSection from '@/components/landing/SpreadsheetSection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <SpreadsheetSection />
      <Footer />
    </main>
  )
}


