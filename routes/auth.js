const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { generateToken } = require('../middleware/auth');

// POST /api/auth/login
// Body: { username, password }
// Returns: JWT token with hotelSlug + role embedded
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const HotelUser = req.masterModels.HotelUser;
    const user = await HotelUser.findOne({ username, is_active: true });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Check hotel is active
    const Hotel = req.masterModels.Hotel;
    const hotel = await Hotel.findById(user.hotel_id);
    if (!hotel || hotel.status === 'suspended') {
      return res.status(403).json({ error: 'Hotel account is suspended. Contact support.' });
    }

    const token = generateToken({
      userId: user._id,
      username: user.username,
      role: user.role,
      hotelId: hotel._id,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
    });

    res.json({
      token,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
      hotel: {
        name: hotel.name,
        slug: hotel.slug,
        plan: hotel.plan,
        admin_pin: hotel.admin_pin,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;