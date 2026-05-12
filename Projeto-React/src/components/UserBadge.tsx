import { DEFAULT_AVATAR } from '../constants'
import type { User } from '../types'

interface UserBadgeProps {
  user: User
}

export function UserBadge({ user }: UserBadgeProps) {
  return (
    <div className="user-badge">
      <img src={user.avatar || DEFAULT_AVATAR} alt={`Avatar de ${user.username}`} />
      <div>
        <strong>{user.username}</strong>
        <span>{user.email}</span>
      </div>
    </div>
  )
}
