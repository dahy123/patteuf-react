// Format Malagasy Ariary
export const formatAr = (amount) => {
  return new Intl.NumberFormat('fr-MG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Ar'
}

export const PACK_PRICE = 3000
export const CASHBACK_AMOUNT = 200
export const PARRAIN_CASHBACK = 200

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
