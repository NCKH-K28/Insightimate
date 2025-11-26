'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: string
  title: string
  label: string
  labelColor: string
  type: string
  typeColor: string
  priority: string
  assignee: string
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Design new billing API',
    label: 'FEATURES',
    labelColor: 'bg-blue-500',
    type: 'STORY',
    typeColor: 'bg-green-500',
    priority: 'high',
    assignee: '👤',
  },
  {
    id: '2',
    title: 'Add advanced analytics tracking events',
    label: 'ANALYTICS',
    labelColor: 'bg-green-500',
    type: 'STORY',
    typeColor: 'bg-green-500',
    priority: 'high',
    assignee: '👤',
  },
  {
    id: '3',
    title: 'Create AI-generated shopping suggestions for homepage',
    label: 'FEATURES',
    labelColor: 'bg-blue-500',
    type: 'STORY',
    typeColor: 'bg-green-500',
    priority: 'low',
    assignee: '👤',
  },
  {
    id: '4',
    title: 'Define requirements to use new AI integrations',
    label: 'FEATURES',
    labelColor: 'bg-blue-500',
    type: 'TASK',
    typeColor: 'bg-blue-500',
    priority: 'medium',
    assignee: '👤',
  },
  {
    id: '5',
    title: 'Improve payment checkout time on mobile',
    label: 'PAYMENTS',
    labelColor: 'bg-purple-500',
    type: 'BUG',
    typeColor: 'bg-red-500',
    priority: 'high',
    assignee: '👤',
  },
]

const columns = [
  { id: 'todo', name: 'TO DO', color: 'bg-gray-100' },
  { id: 'inprogress', name: 'IN PROGRESS', color: 'bg-yellow-50' },
  { id: 'done', name: 'DONE', color: 'bg-green-50' },
]

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  // Bố trí sẵn: TO DO có 1 task, IN PROGRESS có 2 task, DONE có 2 task
  const [taskPositions, setTaskPositions] = useState<{
    [key: string]: string
  }>({
    '1': 'todo',      // Task duy nhất sẽ di chuyển
    '2': 'inprogress', // Task sẵn có ở IN PROGRESS
    '3': 'inprogress', // Task sẵn có ở IN PROGRESS
    '4': 'done',      // Task sẵn có ở DONE
    '5': 'done',      // Task sẵn có ở DONE
  })
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null)

  useEffect(() => {
    // Initial delay before starting animations
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setTaskPositions((prev) => {
          const newPositions = { ...prev }
          
          // Chỉ di chuyển task '1' duy nhất: TO DO → IN PROGRESS → DONE
          if (newPositions['1'] === 'todo') {
            // Highlight task before moving
            setHighlightedTask('1')
            // Move task after highlight animation
            setTimeout(() => {
              setTaskPositions((current) => {
                const updated = { ...current }
                updated['1'] = 'inprogress'
                return updated
              })
              // Keep highlight when it appears in new column, then remove
              setTimeout(() => {
                setHighlightedTask(null)
              }, 2000)
            }, 1500)
            return newPositions
          }
          
          // Task '1' ở IN PROGRESS, di chuyển sang DONE
          if (newPositions['1'] === 'inprogress') {
            // Highlight task before moving
            setHighlightedTask('1')
            // Move task after highlight animation
            setTimeout(() => {
              setTaskPositions((current) => {
                const updated = { ...current }
                updated['1'] = 'done'
                return updated
              })
              // Keep highlight when it appears in new column, then remove
              setTimeout(() => {
                setHighlightedTask(null)
              }, 2000)
            }, 1500)
            return newPositions
          }
          
          // Task '1' ở DONE, reset về TO DO để tạo vòng lặp
          if (newPositions['1'] === 'done') {
            setTimeout(() => {
              setTaskPositions((current) => {
                const updated = { ...current }
                updated['1'] = 'todo'
                setHighlightedTask(null)
                return updated
              })
            }, 1000)
            return newPositions
          }

          return newPositions
        })
      }, 5500) // Move one task every 5.5 seconds (more time for animation)

      return () => clearInterval(interval)
    }, 2000) // Start after 2 seconds

    return () => {
      clearTimeout(startDelay)
    }
  }, [])

  const getTasksForColumn = (columnId: string) => {
    const columnTasks = tasks.filter((task) => taskPositions[task.id] === columnId)
    // Sắp xếp để task '1' (task di chuyển) luôn ở đầu khi xuất hiện
    return columnTasks.sort((a, b) => {
      if (a.id === '1') return -1
      if (b.id === '1') return 1
      return 0
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto lg:mx-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-xl overflow-hidden"
      >
        {/* Board Header */}
        <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-gray-300 text-xs font-bold">I</span>
                </div>
                <span className="font-bold text-gray-900 text-base">Insightimate</span>
              </div>
              <div className="w-5 h-5 flex items-center justify-center cursor-pointer">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex-1 max-w-xs mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 pl-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <span className="text-xs">🚀</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <span className="text-xs">?</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                <span className="text-white text-xs font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-[350px]">
          <div className="grid grid-cols-3 gap-4">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className="mb-3 pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide">
                    {column.name}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {getTasksForColumn(column.id).length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 min-h-[280px]">
                  <AnimatePresence mode="popLayout">
                    {getTasksForColumn(column.id).map((task, index) => {
                      const isHighlighted = highlightedTask === task.id
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 30
                            }
                          }}
                          exit={{ 
                            opacity: 0, 
                            scale: 0.95,
                            y: -5,
                            transition: {
                              duration: 0.2
                            }
                          }}
                          transition={{ 
                            layout: { 
                              type: "spring", 
                              stiffness: 500, 
                              damping: 30,
                              duration: 0.4
                            }
                          }}
                          whileHover={{ scale: 1.01, y: -2 }}
                          className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${
                            isHighlighted 
                              ? 'border-2 border-blue-500 ring-4 ring-blue-200' 
                              : 'border border-gray-200'
                          }`}
                        >
                          {isHighlighted && (
                            <>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ 
                                  opacity: [0, 0.3, 0.3, 0],
                                  scale: [0.95, 1, 1, 1.05],
                                }}
                                transition={{ 
                                  duration: 2,
                                  times: [0, 0.1, 0.9, 1],
                                  repeat: 0
                                }}
                                className="absolute inset-0 rounded-lg bg-blue-500/20 pointer-events-none"
                              />
                              <motion.div
                                initial={{ scale: 1 }}
                                animate={{ 
                                  scale: [1, 1.02, 1.02, 1],
                                }}
                                transition={{ 
                                  duration: 2,
                                  times: [0, 0.1, 0.9, 1],
                                  repeat: 0
                                }}
                                className="absolute -inset-0.5 rounded-lg border-2 border-blue-500 pointer-events-none"
                                style={{
                                  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)'
                                }}
                              />
                            </>
                          )}
                          <h4 className="font-semibold text-gray-900 text-xs mb-2 leading-tight group-hover:text-blue-600 transition-colors relative z-10">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mb-2 flex-wrap relative z-10">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${task.labelColor} shadow-sm`}
                            >
                              {task.label}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${task.typeColor} shadow-sm flex items-center gap-0.5`}
                            >
                              {task.type === 'STORY' && '📋'}
                              {task.type === 'TASK' && '☑️'}
                              {task.type === 'BUG' && '🐛'}
                              {task.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 relative z-10">
                            <span className="text-orange-500 text-xs font-semibold">↑</span>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                              {task.assignee}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}


