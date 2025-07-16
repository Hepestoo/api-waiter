module.exports = (sequelize, DataTypes) => {
  return sequelize.define('users', {
    idUser: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nameUsers: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailUser: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordUser: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    stateUser: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'active',
    },
    createUser: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updateUser: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: false,
    tableName: 'users',
    freezeTableName: true
  });
};