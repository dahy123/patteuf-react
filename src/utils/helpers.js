// Format Malagasy Ariary
export const formatAr = (amount) => {
  return new Intl.NumberFormat('fr-MG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Ar'
}

// Re-export constants from products
export { CASHBACK_AMOUNT, PARRAIN_CASHBACK } from '../data/products'

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
