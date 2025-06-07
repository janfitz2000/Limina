import React from 'react'
import { Logo } from '@/components/Logo'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary to-primary-medium">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Logo />
                <h1 className="text-2xl font-bold text-white">Limina</h1>
              </div>
              <div className="hidden space-x-6 md:flex">
                <a href="#" className="text-white/80 hover:text-white">Dashboard</a>
                <a href="#" className="text-white/80 hover:text-white">Orders</a>
                <a href="#" className="text-white/80 hover:text-white">Settings</a>
              </div>
            </div>
            <button className="btn-primary rounded-lg px-4 py-2">Connect Store</button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Conditional Buy Orders</h2>
          <p className="text-lg text-white/80">
            Let customers place orders that only process when conditions are met
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="feature-card p-6">
            <h3 className="mb-2 text-lg font-semibold text-primary">Active Buy Orders</h3>
            <p className="text-3xl font-bold text-primary-medium">0</p>
          </div>
          <div className="feature-card p-6">
            <h3 className="mb-2 text-lg font-semibold text-primary">Fulfilled Orders</h3>
            <p className="text-3xl font-bold text-primary-medium">0</p>
          </div>
          <div className="feature-card p-6">
            <h3 className="mb-2 text-lg font-semibold text-primary">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary-medium">$0</p>
          </div>
        </div>

        {/* Recent Buy Orders */}
        <div className="feature-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary">Recent Buy Orders</h2>
            <button className="btn-primary rounded-lg px-4 py-2">New Order</button>
          </div>
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-white/60">No buy orders yet</p>
          </div>
        </div>
      </div>
    </main>
  )
} 