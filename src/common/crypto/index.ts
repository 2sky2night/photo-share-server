const Crypto = require('crypto-js')

/**
 * AES对称加密
 * @param content 明文 
 * @param key 密钥
 * @returns 加密结果
 */
export const encrpty = (content: string, key: string) => {
  return Crypto.AES.encrypt(content, key).toString()
}

/**
 * AES解密
 * @param encrptyStr 密文
 * @param key 密钥
 * @returns 解密内容
 */
export const decrpty = (encrptyStr: string, key: string) => {
  return Crypto.AES.decrypt(encrptyStr, key).toString(Crypto.enc.Utf8)
}