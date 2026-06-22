import { Calendar, Radio, Cpu, CheckCircle2, Check } from 'lucide-react'

const STEPS = [
  {
    icon: '📅',
    label: 'Booking Submitted',
    description: 'Your appointment request has been placed'
  },
  {
    icon: '📡',
    label: 'Event Published',
    description: 'Event sent to the message queue'
  },
  {
    icon: '🐍',
    label: 'Processing',
    description: 'Python worker processing notification'
  },
  {
    icon: '✅',
    label: 'Confirmed',
    description: 'Appointment confirmed successfully!'
  }
]

export default function EventStatusTracker({ currentStep = 0, status = 'active' }) {
  return (
    <div className="glass-card-static event-tracker">
      <h3 className="event-tracker-title">
        Event Processing Pipeline
      </h3>
      <div className="event-steps">
        {STEPS.map((step, index) => {
          let stepStatus = 'waiting'
          if (index < currentStep) {
            stepStatus = 'done'
          } else if (index === currentStep) {
            stepStatus = status === 'done' && index === STEPS.length - 1 ? 'done' : 'active'
          }

          return (
            <div key={index} className={`event-step ${stepStatus}`}>
              {/* Vertical connector line */}
              {index < STEPS.length - 1 && (
                <div className="event-step-line" />
              )}

              {/* Step icon circle */}
              <div className="event-step-icon">
                {stepStatus === 'done' ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>

              {/* Step content */}
              <div className="event-step-content">
                <div className="event-step-label">{step.label}</div>
                <div className="event-step-description">{step.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
