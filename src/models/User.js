const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password é obrigatória'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Tecnico', 'Responsavel', 'Administrador'],
    required: [true, 'Perfil é obrigatório']
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Hash da password antes de guardar
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Método para comparar passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);