import { Scroll, Plus } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Projects</h1>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white transition-colors" style={{ background: '#10b77f' }}>
          <Plus className="w-4 h-4" />New Project
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border" style={{ background: '#10b77f18', borderColor: '#10b77f30' }}>
          <Scroll className="w-8 h-8" style={{ color: '#10b77f' }} />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Create your first project</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6">Start publishing changelogs. Each project gets a unique embeddable widget and a public changelog page.</p>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white" style={{ background: '#10b77f' }}>
          <Plus className="w-4 h-4" />New Project
        </button>
      </div>
    </div>
  )
}
