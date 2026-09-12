import prisma from '../config/database.js';

export const ajouterCommentaire = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { contenu, visibilite } = req.body;

    const commentaire = await prisma.commentaire.create({
      data: {
        contenu,
        visibilite: visibilite || 'PUBLIC',
        ticketId: parseInt(ticketId),
        auteurId: req.user.id,
      },
      include: { auteur: { select: { id: true, nom: true, prenom: true, role: true } } },
    });

    res.status(201).json({ status: 'success', data: commentaire });
  } catch (error) {
    next(error);
  }
};

export const consulterCommentaires = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    let whereClause = { ticketId: parseInt(ticketId) };
    if (req.user.role === 'EMPLOYE') {
      whereClause.visibilite = 'PUBLIC';
    }

    const commentaires = await prisma.commentaire.findMany({
      where: whereClause,
      include: { auteur: { select: { id: true, nom: true, prenom: true, role: true } } },
      orderBy: { dateCreation: 'asc' },
    });

    res.status(200).json({ status: 'success', data: commentaires });
  } catch (error) {
    next(error);
  }
};

// Commentaire.modifier()
export const modifierCommentaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu, visibilite } = req.body;

    const comm = await prisma.commentaire.findUnique({ where: { id: parseInt(id) } });
    if (!comm || (comm.auteurId !== req.user.id && req.user.role !== 'ADMINISTRATEUR')) {
      return res.status(403).json({ message: 'Action non autorisée.' });
    }

    const updated = await prisma.commentaire.update({
      where: { id: parseInt(id) },
      data: { contenu, visibilite },
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

// Commentaire.supprimer()
export const supprimerCommentaire = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comm = await prisma.commentaire.findUnique({ where: { id: parseInt(id) } });
    if (!comm || (comm.auteurId !== req.user.id && req.user.role !== 'ADMINISTRATEUR')) {
      return res.status(403).json({ message: 'Action non autorisée.' });
    }

    await prisma.commentaire.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ status: 'success', message: 'Commentaire supprimé.' });
  } catch (error) {
    next(error);
  }
};
