'use client'

import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-gray-200'>
      <div className='absolute top-6 left-16'>
        <Link 
          href='/landing'
          className='flex items-center text-2xl font-bold text-black hover:text-gray-800 transition-colors duration-200 cursor-pointer'
        >
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center mr-2">
            <span className="text-gray-300 font-bold text-lg">I</span>
          </div>
          Insightimate
        </Link>
      </div>

      <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>{children}</div>
      </div>
    </div>
  );
}
