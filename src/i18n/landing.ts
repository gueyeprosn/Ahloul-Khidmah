export type Locale = "fr" | "ar"

export const LOCALE_COOKIE = "ak_locale"

export type LandingDict = {
  nav: {
    why: string
    adhesion: string
    contribute: string
    mission: string
    vision: string
    faq: string
    join: string
    joinNow: string
    monEspace: string
    voirBadge: string
    mediatheque: string
    about: string
    store: string
  }
  hero: {
    brand: string
    title: string
    subtitle: string
    primaryCta: string
    secondaryCta: string
  }
  why: {
    eyebrow: string
    title: string
    intro: string
    items: { title: string; text: string; icon: "heart-handshake" | "users" | "book-open" | "globe-2" }[]
  }
  adhesion: {
    eyebrow: string
    title: string
    intro: string
  }
  mission: {
    eyebrow: string
    title: string
    intro: string
    pillars: { title: string; text: string }[]
  }
  vision: {
    eyebrow: string
    title: string
    summary: string
    full: string
    readMore: string
    readLess: string
  }
  values: {
    eyebrow: string
    title: string
    intro: string
    items: { title: string; text: string }[]
  }
  testimonials: {
    eyebrow: string
    title: string
    items: { quote: string; name: string; role: string }[]
  }
  faq: {
    eyebrow: string
    title: string
    items: { q: string; a: string }[]
  }
  gallery: {
    eyebrow: string
    title: string
    intro: string
  }
  footer: {
    community: string
    slogan: string
    adhesion: string
    contribute: string
    mission: string
    vision: string
    faq: string
    versements: string
    monEspace: string
    mediatheque: string
    about: string
    store: string
  }
  contact: {
    address: string
  }
}

export const dictionaries: Record<Locale, LandingDict> = {
  fr: {
    nav: {
      why: "Pourquoi",
      adhesion: "Adhésion",
      contribute: "Contribuer",
      mission: "Mission",
      vision: "Vision",
      faq: "FAQ",
      join: "Adhérer",
      joinNow: "Adhérer maintenant",
      monEspace: "Mon espace",
      voirBadge: "Voir mon badge",
      mediatheque: "Médiathèque",
      about: "Qui sommes-nous",
      store: "Boutique",
    },
    hero: {
      brand: "Ahloul Khidmah",
      title:
        "Ensemble, servons la Mouridiyah avec Foi, Discipline, Savoir et Excellence.",
      subtitle:
        "Rejoignez une communauté organisée qui mobilise les compétences, les ressources et les talents pour contribuer durablement au rayonnement de Touba et de la Mouridiyah. Adhérez comme membre, ou faites un don — les deux vous donnent accès à votre carte de membre.",
      primaryCta: "Adhérer maintenant",
      secondaryCta: "Contribuer",
    },
    why: {
      eyebrow: "Engagement",
      title: "Pourquoi rejoindre Ahloul Khidmah ?",
      intro:
        "Un cadre moderne pour structurer le service, mobiliser les talents et agir durablement au service de la Mouridiyah.",
      items: [
        {
          title: "Servir",
          text: "Mettre votre énergie au service de Serigne Touba et du rayonnement de la Mouridiyah.",
          icon: "heart-handshake",
        },
        {
          title: "Participer",
          text: "Rejoindre une structure claire, inclusive et complémentaire des organisations existantes.",
          icon: "users",
        },
        {
          title: "Apprendre",
          text: "Développer et partager des compétences concrètes au sein du programme communautaire.",
          icon: "book-open",
        },
        {
          title: "Impacter",
          text: "Contribuer à des résultats visibles, utiles et durables à Touba et au-delà.",
          icon: "globe-2",
        },
      ],
    },
    adhesion: {
      eyebrow: "Adhésion nationale et internationale",
      title: "Rejoignez Ahloul Khidmah",
      intro:
        "Remplissez la fiche d'adhésion en quelques minutes — sans quitter cette page.",
    },
    mission: {
      eyebrow: "La mission",
      title: "Cinq piliers pour transformer le service en actions durables",
      intro:
        "Structurer les forces de la Mouridiyah sous les orientations du Khalife général des Mourides, au service de Touba et de la communauté.",
      pillars: [
        {
          title: "Mobiliser",
          text: "Fédérer une masse critique de talibés engagés — compétences, réseaux et contributions régulières.",
        },
        {
          title: "Organiser",
          text: "Transformer l’énergie collective en structure opérationnelle : rôles, décisions, coordination et discipline.",
        },
        {
          title: "Financer",
          text: "Mettre en place une collecte et une gestion des fonds simples, modernes, traçables et pérennes.",
        },
        {
          title: "Impacter",
          text: "Produire des résultats visibles et mesurables dans les priorités de Ahloul Khidmah, à Touba et ailleurs.",
        },
        {
          title: "Communiquer",
          text: "Informer, documenter et valoriser les actions pour renforcer confiance et crédibilité.",
        },
      ],
    },
    vision: {
      eyebrow: "Notre vision",
      title: "Touba, capitale spirituelle exemplaire",
      summary:
        "Faire de Touba une grande capitale spirituelle du monde musulman — unique, moderne, organisée, propre, accueillante, influente et exemplaire. Cette ambition englobe aussi le rayonnement intellectuel, culturel, social et institutionnel de la Mouridiyah, au Sénégal et à l’international.",
      full: `La vision de Ahloul Khidmah est de contribuer à faire de Touba une grande capitale spirituelle du monde musulman, à la fois unique, moderne, organisée, propre, accueillante, influente et exemplaire. Cette vision ne se limite pas à la dimension urbaine. Elle englobe également le rayonnement intellectuel, culturel, social et institutionnel de la Mouridiyah au Sénégal et à l’international.

Cette vision repose sur une conviction forte : le développement matériel, le développement organisationnel et le développement humain peuvent coexister parfaitement avec la fidélité aux valeurs spirituelles.`,
      readMore: "Lire la vision complète",
      readLess: "Réduire",
    },
    values: {
      eyebrow: "Socle éthique",
      title: "Nos valeurs",
      intro:
        "Elles guident les comportements individuels comme les décisions collectives.",
      items: [
        {
          title: "Utilité",
          text: "Toute initiative s’évalue à l’aune de son apport concret.",
        },
        {
          title: "Responsabilité",
          text: "Chaque membre répond de sa mission, de ses engagements et des résultats.",
        },
        {
          title: "Transparence",
          text: "Finances, décisions et priorités ouvertes pour bâtir la confiance.",
        },
        {
          title: "Rigueur",
          text: "Méthode, précision, fiabilité et professionnalisme dans l’action.",
        },
        {
          title: "Désintéressement",
          text: "Servir avec sincérité et humilité, pour l’agrément divin seul.",
        },
      ],
    },
    testimonials: {
      eyebrow: "Communauté",
      title: "Ils ont choisi de servir",
      items: [
        {
          quote:
            "Adhérer m’a permis de mettre ma compétence au service de la communauté, dans un cadre clair et digne.",
          name: "Membre Ahloul Khidmah",
          role: "Cellule locale — Sénégal",
        },
        {
          quote:
            "La transparence sur les cotisations et les projets m’a convaincu : c’est du khidma organisé, pas du discours.",
          name: "Membre Ahloul Khidmah",
          role: "Diaspora",
        },
        {
          quote:
            "On sent une vraie volonté de servir Serigne Touba avec discipline, savoir et excellence.",
          name: "Membre Ahloul Khidmah",
          role: "Touba",
        },
      ],
    },
    faq: {
      eyebrow: "Questions fréquentes",
      title: "FAQ",
      items: [
        {
          q: "Qui peut adhérer ?",
          a: "Toute personne souhaitant servir Serigne Touba dans un cadre organisé, au Sénégal ou depuis l’étranger, en rejoignant une cellule locale.",
        },
        {
          q: "Y a-t-il une cotisation ?",
          a: "Oui. Plusieurs montants mensuels sont proposés (1 400, 14 000, 140 000 FCFA ou autre), via Wave, Orange Money ou versement en cellule.",
        },
        {
          q: "Comment sont utilisés les fonds ?",
          a: "Les ressources financent les projets de développement de Ahloul Khidmah, dans un esprit de transparence, de rigueur et d’utilité concrète pour la communauté et Touba.",
        },
        {
          q: "Puis-je adhérer depuis l’étranger ?",
          a: "Oui. Le recensement et l’adhésion se font en ligne ; vous rejoignez ensuite votre cellule et contribuez selon les canaux prévus.",
        },
        {
          q: "Dois-je devenir membre pour soutenir ?",
          a: "Pas d’engagement à une cotisation mensuelle si vous ne le souhaitez pas : la contribution est à montant libre, en ligne. Si vous renseignez votre téléphone, vous recevez aussi votre carte de membre, sans cotisation à payer ensuite. L’adhésion reste le chemin pour ceux qui veulent rejoindre une cellule et s’engager durablement.",
        },
      ],
    },
    gallery: {
      eyebrow: "Médiathèque",
      title: "Images du khidma",
      intro:
        "Moments de service, de communauté et de rayonnement à Touba — à parcourir en diaporama.",
    },
    footer: {
      community: "La Communauté des Serviteurs",
      slogan:
        "Servir Serigne Touba avec Foi, Discipline, Savoir et Excellence",
      adhesion: "Adhésion",
      contribute: "Contribuer",
      mission: "Mission",
      vision: "Vision",
      faq: "FAQ",
      versements: "Mes versements",
      monEspace: "Mon espace",
      mediatheque: "Médiathèque",
      about: "Qui sommes-nous",
      store: "Boutique",
    },
    contact: {
      address: "Touba, Sénégal",
    },
  },
  ar: {
    nav: {
      why: "لماذا نحن",
      adhesion: "الانضمام",
      contribute: "المساهمة",
      mission: "المهمة",
      vision: "الرؤية",
      faq: "أسئلة",
      join: "انضم",
      joinNow: "انضم الآن",
      mediatheque: "المعرض",
      monEspace: "مساحتي",
      voirBadge: "عرض بطاقتي",
      about: "من نحن",
      store: "المتجر",
    },
    hero: {
      brand: "أهل الخدمة",
      title:
        "معاً نخدم المريدية بالإيمان والانضباط والعلم والتميز.",
      subtitle:
        "انضموا إلى جماعة منظمة تحشد الكفاءات والموارد والمواهب للمساهمة المستدامة في إشعاع طوبى والمريدية. انضموا كأعضاء، أو قدّموا تبرعاً — كلاهما يمنحكم بطاقة العضوية.",
      primaryCta: "انضم الآن",
      secondaryCta: "ساهم",
    },
    why: {
      eyebrow: "الالتزام",
      title: "لماذا الانضمام إلى أهل الخدمة؟",
      intro:
        "إطار حديث لتنظيم الخدمة، وحشد المواهب، والعمل المستدام في خدمة المريدية.",
      items: [
        {
          title: "الخدمة",
          text: "وضع طاقتكم في خدمة سرين طوبى وإشعاع المريدية.",
          icon: "heart-handshake",
        },
        {
          title: "المشاركة",
          text: "الانضمام إلى هيكل واضح وشامل ومكمل للمنظمات القائمة.",
          icon: "users",
        },
        {
          title: "التعلم",
          text: "تنمية ومشاركة كفاءات ملموسة ضمن البرنامج الجماعي.",
          icon: "book-open",
        },
        {
          title: "الأثر",
          text: "المساهمة في نتائج مرئية ومفيدة ومستدامة في طوبى وما بعدها.",
          icon: "globe-2",
        },
      ],
    },
    adhesion: {
      eyebrow: "الانضمام الوطني والدولي",
      title: "انضموا إلى أهل الخدمة",
      intro: "املأوا استمارة الانضمام في دقائق — دون مغادرة هذه الصفحة.",
    },
    mission: {
      eyebrow: "المهمة",
      title: "خمسة أركان لتحويل الخدمة إلى أعمال مستدامة",
      intro:
        "تنظيم قوى المريدية وفق توجيهات الخليفة العام للمريدين، في خدمة طوبى والجماعة.",
      pillars: [
        {
          title: "التعبئة",
          text: "جمع كتلة حرجة من الطلحة الملتزمين — كفاءات وشبكات ومساهمات منتظمة.",
        },
        {
          title: "التنظيم",
          text: "تحويل الطاقة الجماعية إلى هيكل عملي: أدوار وقرارات وتنسيق وانضباط.",
        },
        {
          title: "التمويل",
          text: "إرساء جمع وإدارة للأموال بسيطة وحديثة وقابلة للتتبع ومستدامة.",
        },
        {
          title: "الأثر",
          text: "تحقيق نتائج مرئية وقابلة للقياس في أولويات أهل الخدمة، في طوبى وخارجها.",
        },
        {
          title: "التواصل",
          text: "الإعلام والتوثيق وإبراز الأعمال لتعزيز الثقة والمصداقية.",
        },
      ],
    },
    vision: {
      eyebrow: "رؤيتنا",
      title: "طوبى، عاصمة روحية نموذجية",
      summary:
        "جعل طوبى عاصمة روحية كبرى للعالم الإسلامي — فريدة وحديثة ومنظمة ونظيفة ومضيافة ومؤثرة ونموذجية. وتشمل هذه الطموحات أيضاً الإشعاع الفكري والثقافي والاجتماعي والمؤسسي للمريدية في السنغال وعلى الصعيد الدولي.",
      full: `تتمثل رؤية أهل الخدمة في المساهمة في جعل طوبى عاصمة روحية كبرى للعالم الإسلامي، فريدة وحديثة ومنظمة ونظيفة ومضيافة ومؤثرة ونموذجية. ولا تقتصر هذه الرؤية على البعد الحضري، بل تشمل أيضاً الإشعاع الفكري والثقافي والاجتماعي والمؤسسي للمريدية في السنغال وعلى الصعيد الدولي.

وترتكز هذه الرؤية على قناعة راسخة: أن التنمية المادية والتنظيمية والبشرية يمكن أن تتعايش تماماً مع الوفاء للقيم الروحية.`,
      readMore: "اقرأ الرؤية كاملة",
      readLess: "طيّ النص",
    },
    values: {
      eyebrow: "الأساس الأخلاقي",
      title: "قيمنا",
      intro: "توجه السلوك الفردي كما القرارات الجماعية.",
      items: [
        {
          title: "النفع",
          text: "يُقيَّم كل مبادرة بمدى فائدتها العملية.",
        },
        {
          title: "المسؤولية",
          text: "يجيب كل عضو عن مهمته والتزاماته ونتائجه.",
        },
        {
          title: "الشفافية",
          text: "مالية وقرارات وأولويات مفتوحة لبناء الثقة.",
        },
        {
          title: "الصرامة",
          text: "منهج ودقة وموثوقية واحترافية في العمل.",
        },
        {
          title: "التجرد",
          text: "الخدمة بصدق وتواضع، لمرضاة الله وحده.",
        },
      ],
    },
    testimonials: {
      eyebrow: "الجماعة",
      title: "اختاروا الخدمة",
      items: [
        {
          quote:
            "الانضمام أتاح لي وضع كفاءتي في خدمة الجماعة، في إطار واضح وكريم.",
          name: "عضو أهل الخدمة",
          role: "خلية محلية — السنغال",
        },
        {
          quote:
            "الشفافية حول الاشتراكات والمشاريع أقنعتني: إنها خدمة منظمة، لا مجرد كلام.",
          name: "عضو أهل الخدمة",
          role: "الجالية",
        },
        {
          quote:
            "نحس بإرادة حقيقية لخدمة سرين طوبى بالانضباط والعلم والتميز.",
          name: "عضو أهل الخدمة",
          role: "طوبى",
        },
      ],
    },
    faq: {
      eyebrow: "أسئلة متكررة",
      title: "الأسئلة الشائعة",
      items: [
        {
          q: "من يمكنه الانضمام؟",
          a: "أي شخص يرغب في خدمة سرين طوبى في إطار منظم، في السنغال أو من الخارج، بالانضمام إلى خلية محلية.",
        },
        {
          q: "هل هناك اشتراك؟",
          a: "نعم. تُقترح مبالغ شهرية (١ ٤٠٠، ١٤ ٠٠٠، ١٤٠ ٠٠٠ فرنك أو مبلغ آخر)، عبر Wave أو Orange Money أو الدفع في الخلية.",
        },
        {
          q: "كيف تُستخدم الأموال؟",
          a: "تموّل الموارد مشاريع تنمية أهل الخدمة، بروح الشفافية والصرامة والنفع الملموس للجماعة ولطوبى.",
        },
        {
          q: "هل يمكنني الانضمام من الخارج؟",
          a: "نعم. يتم التسجيل والانضمام عبر الإنترنت؛ ثم تنضمون إلى خليتكم وتساهمون عبر القنوات المعتمدة.",
        },
        {
          q: "هل يجب أن أصبح عضواً للدعم؟",
          a: "دون اشتراك شهري إن لم ترغبوا في ذلك: المساهمة بمبلغ حر، عبر الإنترنت. إذا أدخلتم رقم هاتفكم، تحصلون أيضاً على بطاقة العضوية، دون اشتراك شهري لاحقاً. الانضمام يبقى مسار من يريد الالتحاق بخلية والالتزام المستمر.",
        },
      ],
    },
    gallery: {
      eyebrow: "المكتبة الإعلامية",
      title: "صور من الخدمة",
      intro: "لحظات من الخدمة والجماعة والإشعاع في طوبى — في عرض شرائح.",
    },
    footer: {
      community: "جماعة الخدم",
      slogan: "خدمة سرين طوبى بالإيمان والانضباط والعلم والتميز",
      adhesion: "الانضمام",
      contribute: "المساهمة",
      mission: "المهمة",
      vision: "الرؤية",
      faq: "الأسئلة",
      versements: "مدفوعاتي",
      monEspace: "مساحتي",
      mediatheque: "المعرض",
      about: "من نحن",
      store: "المتجر",
    },
    contact: {
      address: "طوبى، السنغال",
    },
  },
}
