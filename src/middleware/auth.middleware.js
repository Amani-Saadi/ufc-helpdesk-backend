import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé. Jeton manquant.' });
    }

    const token = authHeader.split(' ')[1];
    
    // MATCHED FALLBACK: changed 'supersecretkey' to 'your_jwt_secret'
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const user = await prisma.utilisateur.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        statutActif: true,
        centreId: true,
        centre: {
          select: { id: true, nom: true, codeBureau: true, statutActif: true }
        }
      }
    });

    if (!user || !user.statutActif) {
      return res.status(401).json({ message: 'Compte inactif ou utilisateur non trouvé.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Failed:', error.message);
    return res.status(401).json({ message: 'Jeton invalide ou expiré.' });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit. Privilèges insuffisants.' });
    }
    next();
  };
};