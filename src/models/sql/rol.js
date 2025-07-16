// ==================== MODELO DE ROL ====================
module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define('roles', {
    // ID primario autoincremental
    idRol: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Nombre del rol (admin, mesero, cliente)
    nombreRol: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // No se permiten duplicados
    }
  }, {
    timestamps: false,           // No se usan campos createdAt ni updatedAt
    tableName: 'roles',          // Nombre exacto de la tabla en BD
    freezeTableName: true        // Evita que Sequelize pluralice el nombre
  });

  return Rol;
};
