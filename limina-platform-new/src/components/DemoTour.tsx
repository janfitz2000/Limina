'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Target, Users, Tag, TrendingUp, BarChart3, Zap } from 'lucide-react'

interface TourStep {
  id: string
  target?: string
  title: string
  content: string
  icon: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlight?: boolean
}

interface DemoTourProps {
  steps: TourStep[]
  onComplete?: () => void
  autoStart?: boolean
  storageKey?: string
}

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LIMINA',
    content: 'This is your merchant dashboard where you can see real-time demand from customers who want to buy your products at specific prices. Let\'s take a quick tour!',
    icon: <Sparkles className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'stats',
    title: 'Your Performance at a Glance',
    content: 'These cards show your key metrics: total orders, customers actively waiting for price drops, revenue generated, and your conversion rate.',
    icon: <BarChart3 className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'orders',
    title: 'Customer Buy Orders',
    content: 'Each row represents a customer who has committed to buy at their target price. You can see what they\'re willing to pay and when their offer expires.',
    icon: <Target className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'action',
    title: 'Convert Demand to Sales',
    content: 'When you\'re ready to offer a discount, go to the Orders page. You can send personalized discount codes to waiting customers with one click.',
    icon: <Tag className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    content: 'Explore the Orders page to see grouped demand by product, and start converting price-sensitive shoppers into customers. Click "View all" to see the full orders page.',
    icon: <Zap className="w-6 h-6" />,
    position: 'center',
  },
]

export const ORDERS_TOUR_STEPS: TourStep[] = [
  {
    id: 'orders-welcome',
    title: 'Orders Management',
    content: 'This page shows all customer price requests grouped by product. See exactly how many customers want each product and at what prices.',
    icon: <Users className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'product-groups',
    title: 'Demand by Product',
    content: 'Products are grouped together showing total waiting customers, lowest ask price, and average ask. Click any product to expand and see individual customer requests.',
    icon: <Target className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'send-discount',
    title: 'Send Discount Codes',
    content: 'When you\'re ready to convert a customer, click "Send Discount". This generates a unique code at their requested price and emails it directly to them.',
    icon: <Tag className="w-6 h-6" />,
    position: 'center',
  },
  {
    id: 'pricing-insights',
    title: 'Pricing Intelligence',
    content: 'Use this data to understand real demand at different price points. If many customers want a product at a similar price, consider a targeted promotion.',
    icon: <TrendingUp className="w-6 h-6" />,
    position: 'center',
  },
]

export function DemoTour({ steps, onComplete, autoStart = true, storageKey = 'demo-tour-completed' }: DemoTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const completed = localStorage.getItem(storageKey)
    if (completed) {
      setHasCompleted(true)
      return
    }

    if (autoStart) {
      const timer = setTimeout(() => setIsOpen(true), 500)
      return () => clearTimeout(timer)
    }
  }, [autoStart, storageKey])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, steps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleComplete = useCallback(() => {
    setIsOpen(false)
    localStorage.setItem(storageKey, 'true')
    setHasCompleted(true)
    onComplete?.()
  }, [storageKey, onComplete])

  const handleSkip = useCallback(() => {
    handleComplete()
  }, [handleComplete])

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHasCompleted(false)
    setCurrentStep(0)
    setIsOpen(true)
  }, [storageKey])

  if (!isOpen || hasCompleted) {
    return (
      <button
        onClick={resetTour}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Replay Tour</span>
      </button>
    )
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleSkip}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600">
                  {step.icon}
                </div>
                <div>
                  <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              {step.content}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip tour
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {currentStep === steps.length - 1 ? (
                    'Get Started'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function DemoTourTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      Take Tour
    </button>
  )
}
