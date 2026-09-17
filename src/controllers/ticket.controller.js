import prisma from '../config/database.js';
import { creerNotification, notifierLesTechniciens } from '../utils/notification.util.js';

export const creerTicket = async (req, res, next) => {
  try {
    const { titre, description, priorite, categorieId, departementId } = req.body;
    
    const ticket = await prisma.ticket.create({
      data: {
        titre,
        description,
        priorite: priorite || 'MOYENNE',
        statut: 'NOUVEAU_NON_VU',
        categorieId: categorieId ? parseInt(categorieId) : null,
        departementId: departementId ? parseInt(departementId) : null,
        employeId: req.user.id,
      },
      include: {
        categorie: true,
        departement: true,
        employe: {
          include: { 
            departement: true 
          }
        }
      }
    });

    // Notify all technicians about the new ticket
    await notifierLesTechniciens(`Nouveau ticket (#${ticket.id}): ${ticket.titre}`);

    res.status(201).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const consulterTickets = async (req, res, next) => {
  try {
    const { categorieId, statut } = req.query;
    let whereClause = {};

    // Role-based filtering
    if (req.user.role === 'EMPLOYE') {
      whereClause.employeId = req.user.id;
    } else if (req.user.role === 'TECHNICIEN_IT') {
      const dbUser = await prisma.utilisateur.findUnique({
        where: { id: req.user.id }
      });

      const techSpecialty = dbUser?.specialite ? String(dbUser.specialite).trim() : '';
      const techCategorieId = dbUser?.categorieId ? parseInt(dbUser.categorieId) : null;
      
      const orConditions = [
        { technicienId: req.user.id }
      ];

      if (techCategorieId) {
        orConditions.push({ categorieId: techCategorieId });
      }

      if (techSpecialty) {
        orConditions.push({
          categorie: {
            nom: {
              contains: techSpecialty,
              mode: 'insensitive'
            }
          }
        });
      }

      whereClause.OR = orConditions;
    }

    if (categorieId && categorieId !== 'all' && !isNaN(parseInt(categorieId))) {
      whereClause.categorieId = parseInt(categorieId);
    }
    
    if (statut && statut !== 'all') {
      whereClause.statut = statut;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: { 
        employe: { 
          include: { 
            departement: true 
          } 
        }, 
        technicien: true, 
        categorie: true, 
        departement: true 
      },
      orderBy: { dateCreation: 'desc' },
    });

    res.status(200).json({ status: 'success', data: tickets });
  } catch (error) {
    next(error);
  }
};

export const marquerCommeVu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({ 
      where: { id: parseInt(id) },
      include: { 
        categorie: true, 
        departement: true, 
        employe: { include: { departement: true } }, 
        technicien: true 
      }
    });

    if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé.' });

    if (ticket.statut === 'NOUVEAU_NON_VU' && (req.user.role === 'TECHNICIEN_IT' || req.user.role === 'ADMINISTRATEUR')) {
      const updated = await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { statut: 'NOUVEAU_VU' },
        include: { 
          categorie: true, 
          departement: true, 
          employe: { include: { departement: true } }, 
          technicien: true 
        }
      });
      return res.status(200).json({ status: 'success', data: updated });
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const changerStatut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const updateData = { statut };
    if (statut === 'RESOLU') updateData.dateResolution = new Date();
    if (statut === 'FERME') updateData.dateCloture = new Date();

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { 
        categorie: true, 
        departement: true, 
        employe: { include: { departement: true } }, 
        technicien: true 
      }
    });

    // Notify employee about status change
    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `Le statut de votre ticket #${ticket.id} est maintenant : ${statut}`
      );
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const changerPriorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priorite } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { priorite },
      include: { 
        categorie: true, 
        departement: true, 
        employe: { include: { departement: true } }, 
        technicien: true 
      }
    });

    // Notify employee about priority change
    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `La priorité de votre ticket #${ticket.id} a été modifiée à : ${priorite}`
      );
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const assignerTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        technicienId: req.user.id,
        statut: 'EN_COURS'
      },
      include: { 
        categorie: true, 
        departement: true, 
        employe: { include: { departement: true } }, 
        technicien: true 
      }
    });

    // Notify employee that a technician took charge of the ticket
    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `Votre ticket #${ticket.id} a été pris en charge par un technicien.`
      );
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const confirmerResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        statut: 'FERME',
        dateCloture: new Date(),
      },
      include: { 
        categorie: true, 
        departement: true, 
        employe: { include: { departement: true } }, 
        technicien: true 
      }
    });

    // Notify technician that employee confirmed resolution
    if (ticket.technicienId) {
      await creerNotification(
        ticket.technicienId,
        `L'employé a confirmé la résolution du ticket #${ticket.id}.`
      );
    }

    res.status(200).json({ status: 'success', message: 'Ticket clôturé avec succès.', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const consulterCommentaires = async (req, res, next) => {
  try {
    const { id } = req.params;
    const commentaires = await prisma.commentaire.findMany({
      where: { ticketId: parseInt(id) },
      include: { auteur: true },
      orderBy: { dateCreation: 'asc' },
    });
    res.status(200).json({ status: 'success', data: commentaires });
  } catch (error) {
    next(error);
  }
};

export const ajouterCommentaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;

    const commentaire = await prisma.commentaire.create({
      data: {
        contenu,
        ticketId: parseInt(id),
        auteurId: req.user.id,
      },
      include: { auteur: true },
    });

    // Retrieve ticket to find who should receive the notification
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      select: { employeId: true, technicienId: true, titre: true }
    });

    if (ticket) {
      // If employee commented -> notify assigned technician. If technician commented -> notify employee.
      const destinataireId = req.user.id === ticket.employeId ? ticket.technicienId : ticket.employeId;

      if (destinataireId) {
        await creerNotification(
          destinataireId,
          `Nouveau commentaire sur le ticket #${id} (${ticket.titre})`
        );
      }
    }

    res.status(201).json({ status: 'success', data: commentaire });
  } catch (error) {
    next(error);
  }
};

export const telechargerFichier = async (req, res, next) => {
  try {
    const { fichierId } = req.params;
    const fichier = await prisma.pieceJointe.findUnique({
      where: { id: parseInt(fichierId) },
    });

    if (!fichier) {
      return res.status(404).json({ message: 'Fichier non trouvé.' });
    }

    res.download(fichier.chemin, fichier.nomOriginal);
  } catch (error) {
    next(error);
  }
};