export const CASHBACK_AMOUNT = 200
export const PARRAIN_CASHBACK = 200

export const products = [
  {
    id: 'pack-1',
    name: '1 Patte + 2 Œufs',
    price: 2600,
    type: 'pack',
    cashback: CASHBACK_AMOUNT,
    parrainBonus: PARRAIN_CASHBACK,
    stock: 20,
  },
  {
    id: 'pack-2',
    name: '1 Patte + 1 Œuf + 1 Koudry',
    price: 3000,
    type: 'pack',
    cashback: CASHBACK_AMOUNT,
    parrainBonus: PARRAIN_CASHBACK,
    stock: 20,
  },
  {
    id: 'simple-3',
    name: '1 Patte',
    price: 1000,
    type: 'simple',
    cashback: 0,
    parrainBonus: 0,
    stock: 50,
  },
  {
    id: 'simple-4',
    name: '1 Œuf',
    price: 800,
    type: 'simple',
    cashback: 0,
    parrainBonus: 0,
    stock: 50,
  },
  {
    id: 'simple-5',
    name: '1 Koudry',
    price: 1200,
    type: 'simple',
    cashback: 0,
    parrainBonus: 0,
    stock: 50,
  },
]
