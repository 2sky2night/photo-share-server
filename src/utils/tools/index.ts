/**
 * 将对象中值为undefined属性去除掉
 * @param object 
 */
export const removeUndefined = <T extends Record<string, any>>(object: T) => {
  // @ts-ignore
  Reflect.ownKeys(object).forEach((key: keyof T) => {
    if (object[key] === undefined) {
      Reflect.deleteProperty(object, key);
    }
  });
  return object
};