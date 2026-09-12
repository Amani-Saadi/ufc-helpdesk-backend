import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

// creerUtilisateur
export const creerUtilisateur = async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, role, telephone, poste, specialite, niveauPrivilege, departementId } = req.body;

    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const newUser = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        role,
        telephone,
        poste,
        specialite,
        niveauPrivilege,
        departementId,
      },
    });

    const { motDePasse: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ status: 'success', data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// desactiverUtilisateur
export const desactiverUtilisateur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.utilisateur.update({
      where: { id: parseInt(id) },
      data: { statutActif: false },
    });
    res.status(200).json({ status: 'success', message: "Utilisateur désactivé avec succès." });
  } catch (error) {
    next(error);
  }
};

// affecterTicket
export const affecterTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { technicienId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: {
        technicienId,
        statut: 'EN_COURS',
      },
    });

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// gererDepartements (Ajouter)
export const ajouterDepartement = async (req, res, next) => {
  try {
    const { nom, codeBureau } = req.body;
    const dept = await prisma.departement.create({ data: { nom, codeBureau } });
    res.status(201).json({ status: 'success', data: dept });
  } catch (error) {
    next(error);
  }
};

// gererCategories (Ajouter)
export const ajouterCategorie = async (req, res, next) => {
  try {
    const { nom, description } = req.body;
    const cat = await prisma.categorie.create({ data: { nom, description } });
    res.status(201).json({ status: 'success', data: cat });
  } catch (error) {
    next(error);
  }
};

// Administrateur.consulterStatistiques()
export const consulterStatistiques = async (req, res, next) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const ticketsParStatut = await prisma.ticket.groupBy({
      by: ['statut'],
      _count: { id: true },
    });
    const ticketsParPriorite = await prisma.ticket.groupBy({
      by: ['priorite'],
      _count: { id: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalTickets,
        ticketsParStatut,
        ticketsParPriorite,
      },
    });
  } catch (error) {
    next(error);
  }
};
