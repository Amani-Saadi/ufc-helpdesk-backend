import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acc�s non autoris�. Jeton manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

    const user = await prisma.utilisateur.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, statutActif: true }
    });

    if (!user || !user.statutActif) {
      return res.status(401).json({ message: 'Compte inactif ou utilisateur non trouv�.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Jeton invalide ou expir�.' });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acc�s interdit. Privil�ges insuffisants.' });
    }
    next();
  };
};
