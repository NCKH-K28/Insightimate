'use client'

export default function Footer() {
  return (
    <footer className="w-full py-16 px-8 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Move fast, stay aligned, and build better - together.
          </h2>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg">
            Get it free
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-500 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs">🔄</span>
            </div>
            <span className="text-blue-200 text-sm">Privacy - Terms</span>
          </div>
          <div className="text-blue-200 text-sm">
            © 2025 Insightimate. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}


