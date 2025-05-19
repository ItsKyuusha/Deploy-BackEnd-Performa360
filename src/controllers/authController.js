const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  // Cari user berdasarkan email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }

  // Cocokkan password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }

  // Buat JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    nama: user.nama,
  });

  // Kirim token dan info user (kecuali password)
  res.json({
    message: 'Login berhasil',
    token,
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    },
  });
};

exports.register = async (req, res) => {
  const { nama, email, password, role } = req.body;

  if (!nama || !email || !password || !role) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ nama, email, password: hashedPassword, role }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: 'Gagal membuat akun', error });
  }

  res.status(201).json({ message: 'Registrasi berhasil', user: data });
};

