import prisma from '../config/database.js';

/**
 * Creates a notification for a specific user.
 * @param {number} utilisateurId - ID of the user receiving the notification
 * @param {string} message - The content of the notification
 */
export const creerNotification = async (utilisateurId, message) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        message,
        utilisateurId: parseInt(utilisateurId),
        estLue: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    throw error;
  }
};

/**
 * Broadcasts a notification to all active technicians and administrators.
 * @param {string} message - The content of the notification
 */
export const notifierLesTechniciens = async (message) => {
  try {
    // Find all users who are technicians or administrators
    const techniciensEtAdmins = await prisma.utilisateur.findMany({
      where: {
        OR: [
          { role: 'TECHNICIEN_IT' },
          { role: 'ADMINISTRATEUR' }
        ]
      },
      select: { id: true }
    });

    if (!techniciensEtAdmins || techniciensEtAdmins.length === 0) {
      console.log("Aucun technicien ou administrateur trouvé pour recevoir la notification.");
      return;
    }

    // Create a notification record for each technician/admin concurrently
    const notificationsData = techniciensEtAdmins.map((tech) => 
      prisma.notification.create({
        data: {
          message,
          utilisateurId: tech.id,
          estLue: false,
        }
      })
    );

    await Promise.all(notificationsData);
  } catch (error) {
    console.error("Erreur lors de la notification des techniciens:", error);
    throw error;
  }
};