const supabase = require('../config/supabaseClient');

// Buat penilaian baru
exports.createPenilaian = async (req, res) => {
  const { id_dinilai, id_survey, ketepatan_waktu, catatan } = req.body;
  const id_penilai = req.user.id;

  // Validasi
  if (!id_dinilai || !id_survey || !ketepatan_waktu) {
    return res.status(400).json({ message: 'Field wajib tidak lengkap' });
  }

  if (ketepatan_waktu < 1 || ketepatan_waktu > 10) {
    return res.status(400).json({ message: 'Skor harus antara 1 sampai 10' });
  }

  // 1. Insert ke data_penilaian
  const { data: dataPenilaian, error: error1 } = await supabase
    .from('data_penilaian')
    .insert([{ ketepatan_waktu, catatan }])
    .select()
    .single();

  if (error1) {
    return res.status(500).json({ message: 'Gagal menyimpan data penilaian', error: error1 });
  }

  // 2. Insert ke penilaian
  const { data: dataPenilai, error: error2 } = await supabase
    .from('penilaian')
    .insert([{
      id_penilai,
      id_dinilai,
      id_survey,
      id_data_penilaian: dataPenilaian.id
    }])
    .select()
    .single();

  if (error2) {
    return res.status(500).json({ message: 'Gagal menyimpan metadata penilaian', error: error2 });
  }

  res.status(201).json({ message: 'Penilaian berhasil disimpan', data: dataPenilai });
};

// Lihat penilaian yang dibuat oleh user
exports.getMyPenilaian = async (req, res) => {
  const id_penilai = req.user.id;

  const { data, error } = await supabase
    .from('penilaian')
    .select(`
      id,
      created_at,
      users!penilaian_id_dinilai_fkey(id, nama, role),
      surveys(id, nama_program),
      data_penilaian(ketepatan_waktu, catatan)
    `)
    .eq('id_penilai', id_penilai);

  if (error) {
    return res.status(500).json({ message: 'Gagal mengambil penilaian', error });
  }

  res.json(data);
};

// Admin melihat semua penilaian
exports.getAllPenilaian = async (req, res) => {
  const { data, error } = await supabase
    .from('penilaian')
    .select(`
        id,
        created_at,
        penilai:users!penilaian_id_penilai_fkey(id, nama, role),
        dinilai:users!penilaian_id_dinilai_fkey(id, nama, role),
        survey:surveys(id, nama_program),
        data:data_penilaian(ketepatan_waktu, catatan)
    `);

  if (error) {
    return res.status(500).json({ message: 'Gagal mengambil seluruh penilaian', error });
  }

  res.json(data);
};

// Admin update isi penilaian
exports.updatePenilaian = async (req, res) => {
  const { id } = req.params;
  const { ketepatan_waktu, catatan } = req.body;

  if (!ketepatan_waktu || ketepatan_waktu < 1 || ketepatan_waktu > 10) {
    return res.status(400).json({ message: 'Skor wajib diisi & harus 1–10' });
  }

  // Ambil id_data_penilaian terkait
  const { data: penilaian, error: err1 } = await supabase
    .from('penilaian')
    .select('id_data_penilaian')
    .eq('id', id)
    .single();

  if (err1 || !penilaian) {
    return res.status(404).json({ message: 'Penilaian tidak ditemukan', error: err1 });
  }

  const { error: err2 } = await supabase
    .from('data_penilaian')
    .update({ ketepatan_waktu, catatan })
    .eq('id', penilaian.id_data_penilaian);

  if (err2) {
    return res.status(500).json({ message: 'Gagal mengupdate penilaian', error: err2 });
  }

  res.json({ message: 'Penilaian berhasil diperbarui' });
};

exports.updatePenilaian = async (req, res) => {
  const { id } = req.params;
  const { ketepatan_waktu, catatan } = req.body;
  const id_user = req.user.id;

  // Validasi
  if (!ketepatan_waktu || ketepatan_waktu < 1 || ketepatan_waktu > 10) {
    return res.status(400).json({ message: 'Skor wajib dan harus antara 1–10' });
  }

  // 1. Cek apakah penilaian dimiliki oleh user
  const { data: penilaianData, error: error1 } = await supabase
    .from('penilaian')
    .select('id, id_penilai, id_data_penilaian')
    .eq('id', id)
    .single();

  if (error1 || !penilaianData) {
    return res.status(404).json({ message: 'Penilaian tidak ditemukan' });
  }

  if (penilaianData.id_penilai !== id_user) {
    return res.status(403).json({ message: 'Kamu tidak berhak mengedit penilaian ini' });
  }

  // 2. Update ke data_penilaian
  const { error: error2 } = await supabase
    .from('data_penilaian')
    .update({ ketepatan_waktu, catatan })
    .eq('id', penilaianData.id_data_penilaian);

  if (error2) {
    return res.status(500).json({ message: 'Gagal update data penilaian', error: error2 });
  }

  res.json({ message: 'Penilaian berhasil diupdate' });
};

exports.deletePenilaian = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id;

  // 1. Ambil data penilaian
  const { data: penilaianData, error: error1 } = await supabase
    .from('penilaian')
    .select('id, id_penilai, id_data_penilaian')
    .eq('id', id)
    .single();

  if (error1 || !penilaianData) {
    return res.status(404).json({ message: 'Penilaian tidak ditemukan' });
  }

  if (penilaianData.id_penilai !== id_user) {
    return res.status(403).json({ message: 'Kamu tidak bisa menghapus penilaian ini' });
  }

  // 2. Hapus penilaian (akan otomatis menghapus data_penilaian karena CASCADE di DB)
  const { error: error2 } = await supabase
    .from('penilaian')
    .delete()
    .eq('id', id);

  if (error2) {
    return res.status(500).json({ message: 'Gagal menghapus penilaian', error: error2 });
  }

  res.json({ message: 'Penilaian berhasil dihapus' });
};
