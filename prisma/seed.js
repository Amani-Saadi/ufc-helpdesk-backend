import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Default Department
  const dept = await prisma.departement.upsert({
    where: { nom: 'Informatique' },
    update: {},
    create: {
      nom: 'Informatique',
      codeBureau: 'INF-101'
    }
  });

  // 2. Create the 3 Categories
  await prisma.categorie.upsert({
    where: { nom: 'Maintenance' },
    update: {},
    create: {
      nom: 'Maintenance',
      description: 'Maintenance du matériel et des équipements'
    }
  });

  await prisma.categorie.upsert({
    where: { nom: 'Réseaux' },
    update: {},
    create: {
      nom: 'Réseaux',
      description: 'Problèmes de connexion, routeurs et câblage'
    }
  });

  await prisma.categorie.upsert({
    where: { nom: 'Site Web' },
    update: {},
    create: {
      nom: 'Site Web',
      description: 'Problèmes liés à la plateforme web et aux accès'
    }
  });

  // 3. Admin User
  await prisma.utilisateur.upsert({
    where: { email: 'admin@ufc.dz' },
    update: { motDePasse: hashedPassword },
    create: {
      nom: 'sadi',
      prenom: 'Amani',
      email: 'admin@ufc.dz',
      motDePasse: hashedPassword,
      role: 'ADMINISTRATEUR',
      statutActif: true
    }
  });

  // 4. Employee User
  await prisma.utilisateur.upsert({
    where: { email: 'employe@ufc.dz' },
    update: { motDePasse: hashedPassword },
    create: {
      nom: 'Benali',
      prenom: 'Karim',
      email: 'employe@ufc.dz',
      motDePasse: hashedPassword,
      role: 'EMPLOYE',
      statutActif: true,
      departementId: dept.id
    }
  });

  // 5. Technician User
  await prisma.utilisateur.upsert({
    where: { email: 'technicien@ufc.dz' },
    update: { motDePasse: hashedPassword },
    create: {
      nom: 'Mansouri',
      prenom: 'Sami',
      email: 'technicien@ufc.dz',
      motDePasse: hashedPassword,
      role: 'TECHNICIEN_IT',
      statutActif: true,
      specialite: 'Réseaux & Matériel',
      departementId: dept.id
    }
  });

  console.log('Seed executed successfully with all categories!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
