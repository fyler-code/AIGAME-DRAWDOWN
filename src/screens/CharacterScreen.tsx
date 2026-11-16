import { Link } from 'react-router-dom'
import { CHARACTERS } from '@/constants/balance'

export function CharacterScreen() {
  return (
    <main>
      <h1>选择角色</h1>
      <ul>
        {Object.values(CHARACTERS).map((character) => (
          <li key={character.id}>{character.name}</li>
        ))}
      </ul>
      <nav>
        <Link to="/">返回</Link>
      </nav>
    </main>
  )
}
