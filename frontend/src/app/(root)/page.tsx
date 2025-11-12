'use client'

import { TakerView } from '@/components/taker-view'

export default function Home() {
  return (
    <div className="space-y-6 p-3">
      <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
      <div className="space-y-4">
        <TakerView />
      </div>
    </div>
  )
}
