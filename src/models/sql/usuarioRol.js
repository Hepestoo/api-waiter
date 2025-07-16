// ==================== MODELO DE TABLA INTERMEDIA USUARIO-ROL ====================
module.exports = (sequelize, DataTypes) => {
  const UsuarioRol = sequelize.define('usuario_rol', {
    // FK del usuario
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // FK del rol
    idRol: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: false,            // No usamos createdAt ni updatedAt
    tableName: 'usuario_rol',     // Nombre exacto de la tabla
    freezeTableName: true         // No pluralizar
  });

  return UsuarioRol;
};
