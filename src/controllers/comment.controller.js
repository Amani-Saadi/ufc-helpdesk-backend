import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Ajouter un commentaire
export const ajouterCommentaire = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id || req.params.ticketId, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "ID de ticket invalide" });
    }

    // Accepts 'contenu', 'texte', or 'content' from frontend request body
    const textContent = req.body.contenu || req.body.texte || req.body.content;
    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ message: "Le contenu du commentaire est requis" });
    }

    const rawUserId = req.user?.id || req.user?.userId;
    if (!rawUserId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    const auteurId = parseInt(rawUserId, 10);

    const ticketExiste = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    if (!ticketExiste) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }

    // Create comment matching schema.prisma fields
    const nouveauCommentaire = await prisma.commentaire.create({
      data: {
        contenu: textContent.trim(), // Matches schema.prisma 'contenu'
        ticketId: ticketId,
        auteurId: auteurId,
        visibilite: req.body.visibilite || 'PUBLIC'
      },
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json(nouveauCommentaire);
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 2. Consulter les commentaires d'un ticket
export const consulterCommentaires = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id || req.params.ticketId, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "ID de ticket invalide" });
    }

    const commentaires = await prisma.commentaire.findMany({
      where: { ticketId: ticketId },
      orderBy: { dateCreation: 'asc' }, // Matches schema.prisma 'dateCreation'
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json(commentaires);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 3. Modifier un commentaire
export const modifierCommentaire = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const textContent = req.body.contenu || req.body.texte || req.body.content;
    const userId = parseInt(req.user?.id || req.user?.userId, 10);
    const userRole = req.user?.role;

    if (isNaN(commentId)) {
      return res.status(400).json({ message: "ID de commentaire invalide" });
    }

    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ message: "Le contenu ne peut pas être vide" });
    }

    const commentaireExistant = await prisma.commentaire.findUnique({
      where: { id: commentId }
    });

    if (!commentaireExistant) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    if (commentaireExistant.auteurId !== userId && userRole !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: "Non autorisé à modifier ce commentaire" });
    }

    const commentaireMisAJour = await prisma.commentaire.update({
      where: { id: commentId },
      data: { contenu: textContent.trim() },
      include: {
        auteur: {
          select: { id: true, nom: true, prenom: true, email: true, role: true }
        }
      }
    });

    return res.status(200).json(commentaireMisAJour);
  } catch (error) {
    console.error("Erreur lors de la modification du commentaire:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 4. Supprimer un commentaire
export const supprimerCommentaire = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user?.id || req.user?.userId, 10);
    const userRole = req.user?.role;

    if (isNaN(commentId)) {
      return res.status(400).json({ message: "ID de commentaire invalide" });
    }

    const commentaireExistant = await prisma.commentaire.findUnique({
      where: { id: commentId }
    });

    if (!commentaireExistant) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    if (commentaireExistant.auteurId !== userId && !['ADMINISTRATEUR', 'TECHNICIEN_IT'].includes(userRole)) {
      return res.status(403).json({ message: "Non autorisé à supprimer ce commentaire" });
    }

    await prisma.commentaire.delete({
      where: { id: commentId }
    });

    return res.status(200).json({ message: "Commentaire supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};