
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Emails recognized as IT technicians
const TECHNICIAN_EMAILS = [
  'abderouf@ufc.dz',
  'safia@ufc.dz',
  'karima@ufc.dz',
  'samira@ufc.dz',
  'lamia@ufc.dz',
  'mounir@ufc.dz',
  'abderahmane@ufc.dz',
  'djamila@ufc.dz',
  'souhila@ufc.dz',
  'samia@ufc.dz',
  'mustapha@ufc.dz'
];

// LOGIN
export const seConnecter = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof motDePasse !== 'string' ||
      !motDePasse
    ) {
      return res.status(400).json({
        message: 'Email et mot de passe obligatoires.'
      });
    }

    const normalizedEmail = email.trim();

    // Find user without modifying the database
    const user = await prisma.utilisateur.findUnique({
      where: { email: normalizedEmail },
      include: {
        centre: {
          select: { id: true, nom: true, codeBureau: true, statutActif: true }
        }
      }
    });

    // Temporary diagnostic logs (never log the password)
    console.log('Login email:', normalizedEmail);
    console.log('User found:', !!user);
    console.log('Password hash exists:', !!user?.motDePasse);

    if (!user || !user.motDePasse) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Check password against the existing stored hash
    let passwordMatch = false;

    try {
      passwordMatch = await bcrypt.compare(
        motDePasse,
        user.motDePasse
      );
    } catch (compareError) {
      console.error('Password comparison error:', compareError.message);
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect.'
      });
    }

    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Determine user role
    let userRole = user.role;

    if (
      TECHNICIAN_EMAILS.includes(
        user.email.toLowerCase()
      )
    ) {
      userRole = 'TECHNICIEN_IT';
    }

    // Verify JWT configuration
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured in .env');
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: userRole,
        centreId: user.centreId,
        centre: user.centre ? {
          id: user.centre.id,
          nom: user.centre.nom,
          codeBureau: user.centre.codeBureau,
          statutActif: user.centre.statutActif
        } : null
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Successful login response
    return res.status(200).json({
      message: 'Connexion réussie.',
      token,
      utilisateur: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: userRole,
        centreId: user.centreId,
        centre: user.centre ? {
          id: user.centre.id,
          nom: user.centre.nom,
          codeBureau: user.centre.codeBureau,
          statutActif: user.centre.statutActif
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// CHANGE PASSWORD
export const modifierMotDePasse = async (req, res, next) => {
  try {
    const {
      ancienMotDePasse,
      nouveauMotDePasse
    } = req.body;

    const userId = req.user?.id ?? req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: 'Utilisateur non authentifié.'
      });
    }

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        message: 'Veuillez remplir tous les champs.'
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
      });
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé.'
      });
    }

    if (!user.motDePasse) {
      return res.status(400).json({
        message: 'Aucun mot de passe enregistré pour cet utilisateur.'
      });
    }

    const passwordMatch = await bcrypt.compare(
      ancienMotDePasse,
      user.motDePasse
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: 'Ancien mot de passe incorrect.'
      });
    }

    const hashedPassword = await bcrypt.hash(
      nouveauMotDePasse,
      10
    );

    await prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        motDePasse: hashedPassword
      }
    });

    return res.status(200).json({
      message: 'Mot de passe modifié avec succès.'
    });
  } catch (error) {
    next(error);
  }
};

// CURRENT AUTHENTICATED USER
export const obtenirProfil = async (req, res, next) => {
  try {
    const userId = Number(req.user?.id ?? req.user?.userId);

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        telephone: true,
        poste: true,
        specialite: true,
        statutActif: true,
        centreId: true,
        centre: {
          select: { id: true, nom: true, codeBureau: true, statutActif: true }
        }
      }
    });

    if (!user || !user.statutActif) {
      return res.status(404).json({ message: 'Utilisateur non trouvé ou compte inactif.' });
    }

    return res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};
