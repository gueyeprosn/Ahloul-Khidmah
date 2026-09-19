import type { Locale } from "@/i18n/landing"

export type AboutDict = {
  eyebrow: string
  title: string
  intro: string
  identity: string[]
  raisonEtre: {
    title: string
    lead: string
    wantTransform: string
    paragraphs: string[]
    transform: string[]
    closing: string
  }
  dieuwrigne: {
    title: string
    role: string
    paragraphs: string[]
  }
  khalife: {
    title: string
    role: string
    paragraphs: string[]
    line: string
    steps: string[]
  }
  cheikh: {
    name: string
    role: string
  }
  pillarsTitle: string
  pillars: {
    n: string
    title: string
    text: string
    slogan: string
  }[]
  vision: {
    title: string
    subtitle: string
    paragraphs: string[]
  }
  valuesTitle: string
  values: { title: string; text: string }[]
  community: {
    title: string
    paragraphs: string[]
    questions: string[]
    closing: string
  }
  engagement: {
    title: string
    paragraphs: string[]
    quote: string
  }
  closing: {
    title: string
    pillars: string
    tagline: string
    call: string
  }
  cta: string
  ctaOr: string
  ctaContribute: string
}

export const aboutByLocale: Record<Locale, AboutDict> = {
  fr: {
    eyebrow: "Qui sommes-nous ?",
    title: "Ahloul Khidmah",
    intro: "Servir, mobiliser et agir pour une œuvre durable",
    identity: [
      "Ahloul Khidmah est une organisation au service de la Mouridiyah et de Serigne Touba, fondée sur les principes de connaissance utile, de travail, de solidarité, d’engagement et de service.",
      "Sous l’autorité du Khalife général des Mourides, Serigne Mouhamadou Mountakha Mbacké, et portée par Dieuwrigne Serigne Mbackiyou Faye dans le cadre de son Ndiguel, Ahloul Khidmah ambitionne de rassembler les femmes et les hommes qui souhaitent mettre leurs compétences, leurs ressources et leur énergie au service de la communauté.",
      "Le mouvement a été officiellement lancé en 2026, à l’occasion du mois béni de Safar et dans la perspective du Grand Magal de Touba. Lors de ce lancement, Serigne Mouhamadou Mountakha Mbacké a signé la première fiche d’adhésion, marquant ainsi son soutien à cette dynamique de mobilisation au service de la Mouridiyah.",
    ],
    raisonEtre: {
      title: "Notre raison d’être",
      lead: "Ahloul Khidmah part d’une conviction : le service de la communauté doit se traduire par des actions concrètes, organisées et durables.",
      wantTransform: "Nous voulons transformer :",
      paragraphs: [
        "Notre ambition est de créer une dynamique permettant à chacun de contribuer, selon ses moyens, ses compétences et ses possibilités, à la réalisation d’œuvres utiles.",
      ],
      transform: [
        "la bonne volonté en engagement",
        "l’engagement en organisation",
        "l’organisation en action",
        "et l’action en impact durable",
      ],
      closing:
        "Dans cet esprit, Ahloul Khidmah se veut une communauté de serviteurs issus de tous les horizons, unis par une même volonté : servir la cause de la Mouridiyah et contribuer à son développement.",
    },
    dieuwrigne: {
      title: "Une initiative portée par Dieuwrigne Mbackiyou Faye",
      role: "Porteur et pilote d’Ahloul Khidmah",
      paragraphs: [
        "Figure engagée au service de la communauté mouride, Dieuwrigne Serigne Mbackiyou Faye porte et pilote la dynamique Ahloul Khidmah.",
        "Son parcours dans l’accompagnement de plusieurs projets communautaires et religieux témoigne d’un engagement constant en faveur de Touba et du Mouridisme.",
        "En avril 2025, il a notamment apporté une contribution de 2,013 milliards de FCFA aux travaux de la Grande Mosquée de Touba, illustrant une nouvelle fois son implication personnelle dans les grands projets de la communauté.",
        "Cette démarche s’inscrit dans une vision plus large : mobiliser les ressources et les forces vives de la communauté pour accompagner les orientations et les projets du Khalife général des Mourides.",
        "Ahloul Khidmah vient ainsi donner une dimension collective, structurée et durable à cette volonté de servir.",
      ],
    },
    khalife: {
      title: "Sous l’autorité du Khalife général",
      role: "Khalife général des Mourides",
      paragraphs: [
        "Ahloul Khidmah s’inscrit dans la dynamique impulsée par le Khalife général des Mourides, Serigne Mouhamadou Mountakha Mbacké.",
        "Le lancement du mouvement fait suite à un Ndiguel reçu par ses responsables. La présence et l’adhésion personnelle du Khalife, qui a signé la première fiche d’adhésion, constituent un acte fondateur de cette nouvelle dynamique.",
      ],
      line: "Notre action repose donc sur une ligne claire :",
      steps: [
        "Recevoir une orientation.",
        "Mobiliser les forces vives.",
        "Organiser les moyens.",
        "Réaliser des projets.",
        "Produire un impact durable.",
      ],
    },
    cheikh: {
      name: "Cheikh Ahmadou Bamba",
      role: "Fondateur du Mouridisme",
    },
    pillarsTitle: "Nos quatre piliers",
    pillars: [
      {
        n: "01",
        title: "Mobiliser",
        text: "Identifier, rassembler et fédérer les personnes qui souhaitent contribuer à une œuvre commune. Nous voulons créer une communauté active de personnes capables de mettre à disposition leur temps, leurs compétences, leurs réseaux et leurs ressources.",
        slogan: "Mobiliser les hommes et les femmes au service du bien.",
      },
      {
        n: "02",
        title: "Organiser",
        text: "Une grande ambition nécessite une organisation solide. Ahloul Khidmah entend structurer les initiatives, coordonner les contributions et mettre en place des mécanismes permettant de transformer les idées en réalisations concrètes.",
        slogan: "Organiser pour mieux servir.",
      },
      {
        n: "03",
        title: "Financer",
        text: "Les projets ont besoin de moyens pour devenir réalité. Ahloul Khidmah vise à faciliter la mobilisation des ressources nécessaires à la réalisation d’actions et de projets répondant aux besoins de la communauté.",
        slogan:
          "Chaque contribution peut devenir une pierre dans une œuvre collective.",
      },
      {
        n: "04",
        title: "Impacter",
        text: "Notre objectif final n’est pas seulement de collecter ou d’organiser. Notre objectif est de produire un impact réel. Nous voulons soutenir des initiatives capables d’améliorer durablement les conditions de vie, de renforcer la solidarité, de promouvoir le savoir et de contribuer au développement de la communauté.",
        slogan:
          "Transformer les ressources en réalisations. Transformer les réalisations en héritage.",
      },
    ],
    vision: {
      title: "Notre vision",
      subtitle: "Construire une communauté organisée autour du service.",
      paragraphs: [
        "Ahloul Khidmah aspire à devenir une plateforme de mobilisation capable de connecter les personnes, les compétences, les ressources, les projets et les besoins de la communauté.",
        "Notre vision est celle d’une Mouridiyah capable de s’appuyer sur ses propres forces vives pour accompagner ses grands projets, soutenir les initiatives utiles et préparer l’avenir.",
      ],
    },
    valuesTitle: "Nos valeurs",
    values: [
      {
        title: "Khidmah — Le service",
        text: "Servir avec sincérité, humilité et responsabilité.",
      },
      {
        title: "Ilm — Le savoir",
        text: "Promouvoir la connaissance utile et la transmission.",
      },
      {
        title: "Amal — L’action",
        text: "Faire du travail et de l’engagement les moteurs de la réalisation.",
      },
      {
        title: "Solidarité",
        text: "Mettre les ressources et les compétences au service du collectif.",
      },
      {
        title: "Organisation",
        text: "Donner à chaque initiative les moyens d’être efficace et durable.",
      },
      {
        title: "Pérennité",
        text: "Privilégier les œuvres dont les bénéfices se prolongent dans le temps.",
      },
    ],
    community: {
      title: "Une communauté, une mission, un impact",
      paragraphs: [
        "Ahloul Khidmah n’est pas simplement une structure. C’est une dynamique de service.",
        "Une dynamique qui invite chaque personne à se demander :",
      ],
      questions: [
        "Que puis-je apporter ?",
        "Quelle compétence puis-je mettre au service du bien ?",
        "Quelle ressource puis-je partager ?",
        "Quelle œuvre pouvons-nous réaliser ensemble ?",
      ],
      closing:
        "Car lorsque les volontés se rencontrent, que les compétences sont organisées et que les ressources sont mises au service d’une vision commune, l’impact devient collectif.",
    },
    engagement: {
      title: "Notre engagement",
      paragraphs: [
        "Nous nous engageons à promouvoir une culture du service, de la responsabilité, de la solidarité et de l’action concrète.",
        "Notre démarche vise à inscrire chaque initiative dans une logique de transparence, d’organisation et de pérennité.",
        "Nous croyons profondément que les meilleures œuvres sont celles dont les bénéfices demeurent et profitent au plus grand nombre.",
      ],
      quote: "Les meilleures œuvres sont celles dont les bénéfices sont pérennes.",
    },
    closing: {
      title: "Ahloul Khidmah",
      pillars: "Mobiliser. Organiser. Financer. Impacter.",
      tagline: "Une communauté de serviteurs au service de la Mouridiyah.",
      call: "Ensemble, transformons notre engagement en œuvres utiles et durables.",
    },
    cta: "Adhérer maintenant",
    ctaOr: "Ou",
    ctaContribute: "Faire un don",
  },

  ar: {
    eyebrow: "من نحن؟",
    title: "أهل الخدمة",
    intro: "خدمة وتعبئة وعمل من أجل أثرٍ دائم",
    identity: [
      "أهل الخدمة منظمة في خدمة المريدية وسرين طوبى، قائمة على مبادئ العلم النافع والعمل والتكافل والالتزام والخدمة.",
      "تحت سلطة الخليفة العام للمريدين سرين محمد منتقا امباكي، وبرعاية ديورين سرين مباكيو فاي في إطار ندغيله، تطمح أهل الخدمة إلى جمع النساء والرجال الراغبين في وضع كفاءاتهم ومواردهم وطاقاتهم في خدمة الجماعة.",
      "أُطلقت الحركة رسميًا سنة ٢٠٢٦، في الشهر المبارك صفر، وفي أفق مغال طوبى الكبير. وخلال هذا الإطلاق، وقّع سرين محمد منتقا امباكي أول استمارة انضمام، مؤكدًا دعمه لهذه الدينامية التعبوية في خدمة المريدية.",
    ],
    raisonEtre: {
      title: "سبب وجودنا",
      lead: "تنطلق أهل الخدمة من قناعة راسخة: خدمة الجماعة يجب أن تتجسد في أعمال ملموسة ومنظمة ومستدامة.",
      wantTransform: "نريد أن نحوّل:",
      paragraphs: [
        "طموحنا هو خلق دينامية تمكّن كل فرد من المساهمة، بحسب وسائله وكفاءاته وإمكاناته، في إنجاز أعمال نافعة.",
      ],
      transform: [
        "حسن النية إلى التزام",
        "الالتزام إلى تنظيم",
        "التنظيم إلى عمل",
        "والعمل إلى أثرٍ دائم",
      ],
      closing:
        "بهذا الروح، تريد أهل الخدمة أن تكون جماعة خدم من كل الآفاق، يجمعهم إرادة واحدة: خدمة قضية المريدية والمساهمة في تنميتها.",
    },
    dieuwrigne: {
      title: "مبادرة يقودها ديورين مباكيو فاي",
      role: "راعي وقائد أهل الخدمة",
      paragraphs: [
        "شخصية ملتزمة في خدمة الجماعة المريدية، يحمل ديورين سرين مباكيو فاي دينامية أهل الخدمة ويقودها.",
        "ومسيرته في مواكبة عدة مشاريع مجتمعية ودينية تشهد على التزام دائم لصالح طوبى والمريدية.",
        "وفي أبريل ٢٠٢٥، قدّم مساهمة قدرها ٢٬٠١٣ مليار فرنك سيفا لأعمال المسجد الكبير في طوبى، مؤكدًا مرة أخرى انخراطه الشخصي في المشاريع الكبرى للجماعة.",
        "تندرج هذه الخطوة في رؤية أوسع: تعبئة موارد القوى الحية للجماعة لمواكبة توجيهات ومشاريع الخليفة العام للمريدين.",
        "وهكذا تمنح أهل الخدمة بعدًا جماعيًا منظمًا ومستدامًا لهذه الإرادة في الخدمة.",
      ],
    },
    khalife: {
      title: "تحت سلطة الخليفة العام",
      role: "الخليفة العام للمريدين",
      paragraphs: [
        "تندرج أهل الخدمة ضمن الدينامية التي يقودها الخليفة العام للمريدين، سرين محمد منتقا امباكي.",
        "وجاء إطلاق الحركة بعد ندغيل تلقاه مسؤولوها. ويُعد حضور الخليفة وانضمامه الشخصي — إذ وقّع أول استمارة انضمام — فعلاً تأسيسيًا لهذه الدينامية الجديدة.",
      ],
      line: "لذلك تقوم أعمالنا على خط واضح:",
      steps: [
        "تلقي التوجيه.",
        "تعبئة القوى الحية.",
        "تنظيم الوسائل.",
        "إنجاز المشاريع.",
        "إنتاج أثرٍ دائم.",
      ],
    },
    cheikh: {
      name: "الشيخ أحمدو بمبا",
      role: "مؤسس المريدية",
    },
    pillarsTitle: "أركاننا الأربعة",
    pillars: [
      {
        n: "٠١",
        title: "التعبئة",
        text: "تحديد وجمع وتوحيد الأشخاص الراغبين في المساهمة في عمل مشترك. نريد بناء جماعة فاعلة قادرة على وضع وقتها وكفاءاتها وشبكاتها ومواردها في الخدمة.",
        slogan: "تعبئة الرجال والنساء في خدمة الخير.",
      },
      {
        n: "٠٢",
        title: "التنظيم",
        text: "الطموح الكبير يحتاج إلى تنظيم متين. تسعى أهل الخدمة إلى هيكلة المبادرات وتنسيق المساهمات ووضع آليات تحوّل الأفكار إلى إنجازات ملموسة.",
        slogan: "ننظّم لنخدم بشكل أفضل.",
      },
      {
        n: "٠٣",
        title: "التمويل",
        text: "تحتاج المشاريع إلى وسائل لتتحول إلى واقع. تهدف أهل الخدمة إلى تسهيل تعبئة الموارد اللازمة لإنجاز أعمال ومشاريع تلبي حاجات الجماعة.",
        slogan: "كل مساهمة يمكن أن تكون لبنة في عمل جماعي.",
      },
      {
        n: "٠٤",
        title: "الأثر",
        text: "هدفنا النهائي ليس الجمع أو التنظيم فحسب، بل إنتاج أثر حقيقي. نريد دعم مبادرات قادرة على تحسين ظروف العيش بشكل مستدام، وتعزيز التكافل، ونشر العلم، والمساهمة في تنمية الجماعة.",
        slogan: "تحويل الموارد إلى إنجازات. وتحويل الإنجازات إلى إرث.",
      },
    ],
    vision: {
      title: "رؤيتنا",
      subtitle: "بناء جماعة منظمة حول الخدمة.",
      paragraphs: [
        "تطمح أهل الخدمة إلى أن تصبح منصة تعبئة تربط بين الأشخاص والكفاءات والموارد والمشاريع وحاجات الجماعة.",
        "رؤيتنا هي مريدية قادرة على الاعتماد على قواها الحية لمواكبة مشاريعها الكبرى، ودعم المبادرات النافعة، والاستعداد للمستقبل.",
      ],
    },
    valuesTitle: "قيمنا",
    values: [
      {
        title: "الخدمة — Khidmah",
        text: "الخدمة بصدق وتواضع ومسؤولية.",
      },
      {
        title: "العلم — Ilm",
        text: "تعزيز العلم النافع ونقله.",
      },
      {
        title: "العمل — Amal",
        text: "جعل العمل والالتزام محركين للإنجاز.",
      },
      {
        title: "التكافل",
        text: "وضع الموارد والكفاءات في خدمة الجماعة.",
      },
      {
        title: "التنظيم",
        text: "منح كل مبادرة وسائل الفعالية والاستدامة.",
      },
      {
        title: "الديمومة",
        text: "تفضيل الأعمال التي تدوم منافعها مع الزمن.",
      },
    ],
    community: {
      title: "جماعة، مهمة، وأثر",
      paragraphs: [
        "أهل الخدمة ليست مجرد هيكل. إنها دينامية خدمة.",
        "دينامية تدعو كل شخص إلى أن يسأل نفسه:",
      ],
      questions: [
        "ماذا يمكنني أن أقدّم؟",
        "أي كفاءة يمكنني أن أضعها في خدمة الخير؟",
        "أي مورد يمكنني أن أشاركه؟",
        "أي عمل يمكننا إنجازه معًا؟",
      ],
      closing:
        "فحين تلتقي الإرادات، وتُنظَّم الكفاءات، وتُوضع الموارد في خدمة رؤية مشتركة، يصبح الأثر جماعيًا.",
    },
    engagement: {
      title: "التزامنا",
      paragraphs: [
        "نلتزم بترسيخ ثقافة الخدمة والمسؤولية والتكافل والعمل الملموس.",
        "وتسعى مقاربتنا إلى إدراج كل مبادرة في منطق الشفافية والتنظيم والديمومة.",
        "ونؤمن بعمق أن أفضل الأعمال هي تلك التي تدوم منافعها وتعود بالنفع على أكبر عدد.",
      ],
      quote: "أفضل الأعمال ما دامت منافعه.",
    },
    closing: {
      title: "أهل الخدمة",
      pillars: "تعبئة. تنظيم. تمويل. أثر.",
      tagline: "جماعة خدم في خدمة المريدية.",
      call: "معًا نحوّل التزامنا إلى أعمال نافعة ودائمة.",
    },
    cta: "انضم الآن",
    ctaOr: "أو",
    ctaContribute: "قدّم تبرعاً",
  },
}

/** @deprecated utiliser aboutByLocale */
export const about = aboutByLocale.fr
