import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  backTo?: string
  onBack?: () => void
}

export function ScreenHeader({ title, subtitle, rightSlot, backTo, onBack }: ScreenHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backTo) {
      navigate(backTo)
    }
  }

  return (
    <header className="screen-header">
      <div className="screen-header__left">
        {(backTo || onBack) && (
          <button type="button" className="ghost-button" onClick={handleBack} aria-label="Назад">
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
