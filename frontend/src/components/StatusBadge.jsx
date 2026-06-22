import { Check } from 'lucide-react'

export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase()

  let className = 'badge '
  switch (normalized) {
    case 'CONFIRMED':
      className += 'badge-confirmed'
      break
    case 'CANCELLED':
      className += 'badge-cancelled'
      break
    case 'PENDING':
    default:
      className += 'badge-pending'
      break
  }

  return (
    <span className={className}>
      {normalized === 'CONFIRMED' ? (
        <Check size={12} strokeWidth={3} />
      ) : (
        <span className="badge-dot" />
      )}
      {normalized || 'PENDING'}
    </span>
  )
}
