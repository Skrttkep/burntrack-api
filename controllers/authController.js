const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const register = async (req, res) => {
  try {
    const { name, email, password, age, weight, height } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nama, email, dan password wajib diisi',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password minimal 6 karakter',
      });
    }

    const normalizedEmail = email.toLowerCase();

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({
        message: 'Gagal mengecek email',
        error: checkError.message,
      });
    }

    if (existingUser) {
      return res.status(400).json({
        message: 'Email sudah terdaftar',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          age: age || null,
          weight: weight || null,
          height: height || null,
        },
      ])
      .select('id, name, email, age, weight, height, created_at')
      .single();

    if (insertError) {
      return res.status(500).json({
        message: 'Registrasi gagal',
        error: insertError.message,
      });
    }

    return res.status(201).json({
      message: 'Registrasi berhasil',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age,
        weight: newUser.weight,
        height: newUser.height,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email dan password wajib diisi',
      });
    }

    const normalizedEmail = email.toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password, age, weight, height')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        message: 'Gagal mengambil data user',
        error: error.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        message: 'Email atau password salah',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email atau password salah',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    return res.status(200).json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};