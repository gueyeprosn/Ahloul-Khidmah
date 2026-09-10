import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const visionSlides = [
  {
    src: "/brand/slides/drone-touba-1.jpg",
    alt: "Grande Mosquée de Touba — vue drone",
  },
  {
    src: "/brand/slides/drone-touba-2.jpg",
    alt: "Touba — vue aérienne",
  },
  {
    src: "/brand/slides/342352396_534673642195408_18788620982124.jpg",
    alt: "Communauté et service à Touba",
  },
  {
    src: "/brand/slides/efaytfvx4ae4ect.jpg",
    alt: "Scène communautaire Ahloul Khidmah",
  },
  {
    src: "/brand/slides/gdv7h2nwgaeyljh.jpg",
    alt: "Engagement et khidma",
  },
  {
    src: "/brand/slides/culture_mouride_1742743763336.jpg",
    alt: "Culture mouride",
  },
  {
    src: "/brand/slides/jad20230424-culture-ass-cheikh-ahmadou-b.jpg",
    alt: "Héritage de Cheikh Ahmadou Bamba",
  },
]

const testimonials = [
  {
    quoteFr:
      "Adhérer m’a permis de mettre ma compétence au service de la communauté, dans un cadre clair et digne.",
    quoteAr:
      "الانضمام أتاح لي وضع كفاءتي في خدمة الجماعة، في إطار واضح وكريم.",
    name: "Membre Ahloul Khidmah",
    roleFr: "Cellule locale — Sénégal",
    roleAr: "خلية محلية — السنغال",
    sortOrder: 0,
  },
  {
    quoteFr:
      "La transparence sur les cotisations et les projets m’a convaincu : c’est du khidma organisé, pas du discours.",
    quoteAr:
      "الشفافية حول الاشتراكات والمشاريع أقنعتني: إنها خدمة منظمة، لا مجرد كلام.",
    name: "Membre Ahloul Khidmah",
    roleFr: "Diaspora",
    roleAr: "الجالية",
    sortOrder: 1,
  },
  {
    quoteFr:
      "On sent une vraie volonté de servir Serigne Touba avec discipline, savoir et excellence.",
    quoteAr:
      "نحس بإرادة حقيقية لخدمة سرين طوبى بالانضباط والعلم والتميز.",
    name: "Membre Ahloul Khidmah",
    roleFr: "Touba",
    roleAr: "طوبى",
    sortOrder: 2,
  },
]

async function seedCms() {
  const vision = await prisma.album.upsert({
    where: { key: "vision" },
    update: { title: "Vision", published: true, sortOrder: 0 },
    create: {
      key: "vision",
      title: "Vision",
      description: "Carousel de la section Vision du site public",
      published: true,
      sortOrder: 0,
    },
  })

  await prisma.album.upsert({
    where: { key: "galerie" },
    update: { title: "Galerie", published: true, sortOrder: 1 },
    create: {
      key: "galerie",
      title: "Galerie",
      description: "Galerie photo du site public",
      published: true,
      sortOrder: 1,
    },
  })

  const photoCount = await prisma.photo.count({
    where: { albumId: vision.id },
  })
  if (photoCount === 0) {
    await prisma.photo.createMany({
      data: visionSlides.map((s, i) => ({
        albumId: vision.id,
        src: s.src,
        alt: s.alt,
        published: true,
        sortOrder: i,
      })),
    })
    console.log(`✓ ${visionSlides.length} photos Vision importées`)
  } else {
    console.log("✓ Photos Vision déjà présentes")
  }

  const testiCount = await prisma.testimonial.count()
  if (testiCount === 0) {
    await prisma.testimonial.createMany({ data: testimonials })
    console.log(`✓ ${testimonials.length} témoignages importés`)
  } else {
    console.log("✓ Témoignages déjà présents")
  }
}

/**
 * Catalogue de démonstration pour le lancement de la boutique — produits
 * réels de la liste MVP (pins, porte-clés, textile, packs), prix et stocks
 * de départ à ajuster depuis le dashboard admin. N'écrase rien si des
 * catégories existent déjà (relance sûre du seed).
 */
async function seedStoreDemo() {
  const categoryCount = await prisma.category.count()
  if (categoryCount > 0) {
    console.log("✓ Catalogue boutique déjà présent")
    return
  }

  const categories = await Promise.all(
    [
      { slug: "identite", name: "Identité", sortOrder: 0 },
      { slug: "papeterie", name: "Papeterie", sortOrder: 1 },
      { slug: "textile", name: "Textile", sortOrder: 2 },
      { slug: "packs", name: "Packs", sortOrder: 3 },
    ].map((c) => prisma.category.create({ data: c }))
  )
  const catId = (slug: string) =>
    categories.find((c) => c.slug === slug)!.id

  await prisma.product.create({
    data: {
      slug: "pin-ahloul-khidmah",
      sku: "PIN-001",
      name: "Pin Ahloul Khidmah",
      description:
        "Pin émaillé aux couleurs d'Ahloul Khidmah, à porter au quotidien.",
      price: 1500,
      stock: 200,
      categoryId: catId("identite"),
      featured: true,
    },
  })
  await prisma.product.create({
    data: {
      slug: "porte-cles-ahloul-khidmah",
      sku: "KEY-001",
      name: "Porte-clés Ahloul Khidmah",
      description: "Porte-clés métal gravé du logo Ahloul Khidmah.",
      price: 2000,
      stock: 150,
      categoryId: catId("identite"),
    },
  })
  await prisma.product.create({
    data: {
      slug: "bracelet-ahloul-khidmah",
      sku: "BR-001",
      name: "Bracelet Ahloul Khidmah",
      description: "Bracelet tissé aux couleurs de la communauté.",
      price: 1500,
      stock: 180,
      categoryId: catId("identite"),
    },
  })
  await prisma.product.create({
    data: {
      slug: "carnet-ahloul-khidmah",
      sku: "CAR-001",
      name: "Carnet Ahloul Khidmah",
      description: "Carnet de notes broché, couverture floquée du logo.",
      price: 3000,
      stock: 100,
      categoryId: catId("papeterie"),
    },
  })
  await prisma.product.create({
    data: {
      slug: "stylo-ahloul-khidmah",
      sku: "STY-001",
      name: "Stylo Ahloul Khidmah",
      description: "Stylo bille métal gravé, écrin cadeau.",
      price: 1000,
      stock: 250,
      categoryId: catId("papeterie"),
    },
  })
  await prisma.product.create({
    data: {
      slug: "tote-bag-ahloul-khidmah",
      sku: "TOTE-001",
      name: "Tote Bag Ahloul Khidmah",
      description: "Sac en toile épaisse, sérigraphie Ahloul Khidmah.",
      price: 4000,
      stock: 80,
      categoryId: catId("textile"),
      isNew: true,
    },
  })
  await prisma.product.create({
    data: {
      slug: "casquette-ahloul-khidmah",
      sku: "CAP-001",
      name: "Casquette Ahloul Khidmah",
      description: "Casquette brodée, réglable, coloris vert émeraude.",
      price: 5000,
      stock: 60,
      categoryId: catId("textile"),
    },
  })
  await prisma.product.create({
    data: {
      slug: "t-shirt-ahloul-khidmah",
      sku: "TSH-001",
      name: "T-shirt Ahloul Khidmah",
      description: "T-shirt coton, logo brodé — disponible en plusieurs tailles.",
      price: 6000,
      stock: 0,
      categoryId: catId("textile"),
      featured: true,
      variants: {
        create: [
          {
            label: "S",
            attributes: JSON.stringify({ taille: "S" }),
            sku: "TSH-001-S",
            stock: 20,
          },
          {
            label: "M",
            attributes: JSON.stringify({ taille: "M" }),
            sku: "TSH-001-M",
            stock: 35,
          },
          {
            label: "L",
            attributes: JSON.stringify({ taille: "L" }),
            sku: "TSH-001-L",
            stock: 25,
          },
        ],
      },
    },
  })
  await prisma.product.create({
    data: {
      slug: "pack-essentiel",
      sku: "PACK-ESS-001",
      name: "Pack Essentiel",
      description: "Pin + porte-clés + bracelet + sticker Ahloul Khidmah.",
      price: 5000,
      compareAtPrice: 6000,
      stock: 50,
      categoryId: catId("packs"),
      featured: true,
    },
  })
  await prisma.product.create({
    data: {
      slug: "pack-membre",
      sku: "PACK-MEM-001",
      name: "Pack Membre",
      description:
        "Pin + porte-clés + carnet + stylo + étui pour carte membre Ahloul Khidmah.",
      price: 12000,
      compareAtPrice: 14500,
      stock: 40,
      categoryId: catId("packs"),
    },
  })

  console.log("✓ Catalogue boutique de démonstration créé (10 produits)")
}

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || "Administrateur"

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires pour le seed (pas de défaut)."
    )
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD doit faire au moins 12 caractères.")
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, role: "admin" },
    })
    console.log(`✓ Admin existant conservé : ${email}`)
  } else {
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { email, name, passwordHash, role: "admin" },
    })
    console.log(`✓ Admin créé : ${email}`)
  }

  await seedCms()
  await seedStoreDemo()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
