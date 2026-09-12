import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const seConnecter = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const match = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!match) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '24h' }
    );

    const { motDePasse: _, ...userWithoutPassword } = user;
    res.status(200).json({ message: 'Connexion réussie', token, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};
