import { createContext } from 'react'
import typeMaterials from './assets/typeMaterials.json'
import types from './assets/types.json'

export const SdeContext = createContext({
  typeMaterials,
  types,
})
