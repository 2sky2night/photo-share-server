export interface TokenData {
  sub: number
  iat: number
  exp: number
}

export type TokenKey = keyof TokenData