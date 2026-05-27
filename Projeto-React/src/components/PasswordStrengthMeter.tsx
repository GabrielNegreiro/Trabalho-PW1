import { evaluatePasswordStrength } from '../security'

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null

  const strength = evaluatePasswordStrength(password)

  return (
    <div className={`password-strength ${strength.level}`}>
      <div className="strength-header">
        <span>{strength.label}</span>
        <strong>{strength.score}/5</strong>
      </div>
      <div className="strength-track">
        <span style={{ width: `${(strength.score / 5) * 100}%` }} />
      </div>
      {strength.tips.length > 0 && <small>{strength.tips.slice(0, 2).join(' ')}</small>}
    </div>
  )
}
