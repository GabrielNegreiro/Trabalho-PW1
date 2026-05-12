import { useState } from 'react'

interface PasswordFieldProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function PasswordField({ value, onChange, required = true }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="password-field">
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        type={isVisible ? 'text' : 'password'}
        required={required}
      />
      <button type="button" onClick={() => setIsVisible(current => !current)}>
        {isVisible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}
