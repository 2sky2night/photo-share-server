import { Table, Model, Column, PrimaryKey, Comment, DataType, AutoIncrement, Length, Default } from "sequelize-typescript";
import { Role, Roles, roles } from "../../auth/role";
@Table({
  tableName: 'user'
})
export class User extends Model<User>{

  @Comment('账户id')
  @PrimaryKey
  @AutoIncrement
  @Column
  uid: number;

  @Comment('账户名称')
  @Column(DataType.STRING)
  username: string;

  @Comment('账户密码')  
  @Column(DataType.STRING)
  password: string;

  @Length({ max: 512 })
  @Comment('账户头像')
  @Column(DataType.STRING)
  avatar: string;

  @Comment('用户角色')
  @Column(DataType.ENUM(...roles))
  // @Default(Roles.User)
  role: Role
}