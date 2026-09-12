import prisma from '../config/database.js';

export const consulterTechniciens = async (req, res, next) => {
  try {
    const techniciens = await prisma.utilisateur.findMany({
      where: { role: 'TECHNICIEN_IT', statutActif: true },
      select: { id: true, nom: true, prenom: true, email: true, specialite: true, departement: true },
    });
    res.status(200).json({ status: 'success', data: techniciens });
  } catch (error) {
    next(error);
  }
};

export const consulterEmployes = async (req, res, next) => {
  try {
    const employes = await prisma.utilisateur.findMany({
      where: { role: 'EMPLOYE', statutActif: true },
      select: { id: true, nom: true, prenom: true, email: true, poste: true, departement: true },
    });
    res.status(200).json({ status: 'success', data: employes });
  } catch (error) {
    next(error);
  }
};
