import prisma from '../config/database.js';

// consulterMesNotifications
export const consulterMesNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { utilisateurId: req.user.id },
      orderBy: { dateEnvoi: 'desc' },
      take: 20,
    });

    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    next(error);
  }
};

// marquerCommeLue
export const marquerCommeLue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(id), utilisateurId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée.' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { estLue: true },
    });

    res.status(200).json({ status: 'success', data: updatedNotification });
  } catch (error) {
    next(error);
  }
};

// marquerToutesCommeLues
export const marquerToutesCommeLues = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { utilisateurId: req.user.id, estLue: false },
      data: { estLue: true },
    });

    res.status(200).json({ status: 'success', message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (error) {
    next(error);
  }
};