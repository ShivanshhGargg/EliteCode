import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'
import { NeonButton } from '../components/NeonButton'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] bg-neon-red/5 rounded-full blur-[100px]" />
      <div className="relative text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={36} className="text-neon-red" />
        </div>
        <h1 className="text-6xl font-bold text-txt-primary">404</h1>
        <p className="text-xl text-txt-secondary">Lost in the void</p>
        <p className="text-sm text-txt-muted max-w-sm mx-auto">
          The page you're looking for doesn't exist. Maybe it was swallowed by a black hole.
        </p>
        <Link to="/">
          <NeonButton variant="solid">
            <Home size={16} className="mr-2" /> Back to Workspace
          </NeonButton>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
