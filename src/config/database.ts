import { SequelizeOptions } from "sequelize-typescript";

/**
 * 数据库连接配置项
 */
export const databaseConfig: SequelizeOptions = {
  dialect: 'mysql',
  host: 'localhost',
  database: 'photo_share',
  username: 'root',
  password: '1234',
  port: 3306
}
