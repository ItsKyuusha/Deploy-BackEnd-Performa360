const supabase = require('../config/supabaseClient');

// Buat survei baru (Admin only)
exports.createSurvey = async (req, res) => {
  const { nama_program, keterangan } = req.body;

  if (!nama_program) {
    return res.status(400).json({ message: 'Nama program wajib diisi' });
  }

  const { data, error } = await supabase
    .from('surveys')
    .insert([{ nama_program, keterangan }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: 'Gagal membuat survei', error });
  }

  res.status(201).json({ message: 'Survei berhasil dibuat', data });
};

// Ambil semua survei (untuk Admin)
exports.getAllSurveys = async (req, res) => {
  const { data, error } = await supabase.from('surveys').select('*');

  if (error) {
    return res.status(500).json({ message: 'Gagal mengambil survei', error });
  }

  res.json(data);
};

// Ambil survei berdasarkan user login (untuk dashboard user)
exports.getSurveysByUser = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('anggota_survey')
    .select('id, id_survey, role_di_survey, surveys(*)')
    .eq('id_user', userId);

  if (error) {
    return res.status(500).json({ message: 'Gagal mengambil survei pengguna', error });
  }

  const result = data.map((row) => ({
    id_anggota: row.id,
    role_di_survey: row.role_di_survey,
    survey: row.surveys,
  }));

  res.json(result);
};

// Tambahkan anggota ke survei
exports.addSurveyMember = async (req, res) => {
  const { id_user, id_survey, role_di_survey } = req.body;

  if (!id_user || !id_survey || !role_di_survey) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const { data, error } = await supabase
    .from('anggota_survey')
    .insert([{ id_user, id_survey, role_di_survey }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: 'Gagal menambahkan anggota survei', error });
  }

  res.status(201).json({ message: 'Anggota berhasil ditambahkan', data });
};

// Edit survei
exports.updateSurvey = async (req, res) => {
  const { id } = req.params;
  const { nama_program, keterangan } = req.body;

  const { data, error } = await supabase
    .from('surveys')
    .update({ nama_program, keterangan })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: 'Gagal mengupdate survei', error });
  }

  res.json({ message: 'Survei diperbarui', data });
};

// Hapus survei
exports.deleteSurvey = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('surveys').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ message: 'Gagal menghapus survei', error });
  }

  res.json({ message: 'Survei berhasil dihapus' });
};
