import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  backTo?: string
}

export function ScreenHeader({ title, subtitle, rightSlot, backTo }: ScreenHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="screen-header">
      <div className="screen-header__left">
        {backTo && (
          <button type="button" className="ghost-button" onClick={() => navigate(backTo)} aria-label="Назад">
            ←
          </button>
        )}
        <div>
          <h1 className="screen-header__title">{title}</h1>
          {subtitle && <p className="screen-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {rightSlot && <div className="screen-header__right">{rightSlot}</div>}
    </header>
  )
}
