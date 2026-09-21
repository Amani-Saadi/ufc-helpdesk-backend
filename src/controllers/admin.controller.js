import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

// Récupérer la liste de tous les utilisateurs
export const listerUtilisateurs = async (req, res, next) => {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        telephone: true,
        poste: true,
        specialite: true,
        niveauPrivilege: true, // CORRIGÉ : camelCase au lieu de niveau_privilege
        statutActif: true,     // CORRIGÉ : camelCase au lieu de statut_actif
        centreId: true,        // CORRIGÉ : camelCase au lieu de centre_id
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

// Récupérer la liste de tous les centres
export const listerCentres = async (req, res, next) => {
  try {
    const centres = await prisma.centre.findMany({
      orderBy: { nom: 'asc' },
    });

    res.status(200).json({ status: 'success', data: centres });
  } catch (error) {
    next(error);
  }
};

// Créer un utilisateur (Employé, Technicien, etc.)
export const creerUtilisateur = async (req, res, next) => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      role,
      telephone,
      poste,
      specialite,
      niveauPrivilege,
      centreId,
    } = req.body;

    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: "Un utilisateur avec cet email existe déjà." });
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
        niveauPrivilege, // CORRIGÉ
        centreId: centreId ? parseInt(centreId, 10) : null, // CORRIGÉ : centreId au lieu de centre_id
      },
    });

    const { motDePasse: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ status: 'success', data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// Activer ou désactiver un utilisateur (Basculement dynamique)
export const desactiverUtilisateur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ status: 'fail', message: "ID d'utilisateur invalide." });
    }

    const targetUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({ status: 'fail', message: "Utilisateur non trouvé." });
    }

    // Bascule dynamique du statut
    const currentStatus = targetUser.statutActif ?? true;
    const newStatus = !currentStatus;

    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data: { statutActif: newStatus }, // CORRIGÉ : statutActif
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        statutActif: true, // CORRIGÉ : statutActif
      },
    });

    res.status(200).json({
      status: 'success',
      message: newStatus ? "Utilisateur activé avec succès." : "Utilisateur désactivé avec succès.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Affecter un ticket à un technicien
export const affecterTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { technicienId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(ticketId, 10) },
      data: {
        technicienId: parseInt(technicienId, 10), // CORRIGÉ : technicienId si nécessaire
        statut: 'EN_COURS',
      },
    });

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// Ajouter un centre
export const ajouterCentre = async (req, res, next) => {
  try {
    const { nom, codeBureau } = req.body;
    const centre = await prisma.centre.create({
      data: {
        nom,
        codeBureau, // CORRIGÉ : codeBureau au lieu de code_bureau
      },
    });
    res.status(201).json({ status: 'success', data: centre });
  } catch (error) {
    next(error);
  }
};

// Ajouter une catégorie
export const ajouterCategorie = async (req, res, next) => {
  try {
    const { nom, description } = req.body;
    const cat = await prisma.categorie.create({ data: { nom, description } });
    res.status(201).json({ status: 'success', data: cat });
  } catch (error) {
    next(error);
  }
};

// Consulter les statistiques du système
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