'use client';

import { motion } from 'framer-motion';

export default function WorkflowSection() {
  return (
    <section className='w-full py-20 px-8 bg-white'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20'>
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='order-2 lg:order-1'
          >
            <div className='bg-white rounded-xl shadow-xl overflow-hidden'>
              <img
                src='https://res.cloudinary.com/dh41tyuha/image/upload/v1763124517/Screenshot_from_2025-11-14_21-48-18_yxdcgv.png'
                alt='Customize workflow'
                className='w-full h-auto object-contain'
              />
            </div>
          </motion.div>

          {/* Right - Text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='order-1 lg:order-2'
          >
            <h2 className='text-4xl font-bold text-blue-600 mb-6'>
              Customize how your team&apos;s work flows
            </h2>
            <p className='text-xl text-gray-700 leading-relaxed'>
              Set up, clean up, and automate even the most complicated project workflows.
            </p>
          </motion.div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl font-bold text-blue-600 mb-6'>
              Stay on track even when the track changes
            </h2>
            <p className='text-xl text-gray-700 leading-relaxed'>
              Use the timeline view to map out the big picture, communicate updates to stakeholders,
              and ensure your team stays on the same page.
            </p>
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className='bg-white rounded-xl shadow-xl overflow-hidden'>
              <img
                src='https://res.cloudinary.com/dh41tyuha/image/upload/v1763124622/Screenshot_from_2025-11-14_21-50-05_g1v9lm.png'
                alt='Timeline view'
                className='w-full h-auto object-contain'
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
