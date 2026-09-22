import type { Locale } from "@/i18n/landing"

export type FormDict = {
  intro: { before: string; cell: string; after: string }
  steps: [string, string, string, string, string]
  sections: {
    refs: { title: string; subtitle: string }
    personal: { title: string; subtitle: string }
    skills: { title: string; subtitle: string }
    contrib: { title: string; subtitle: string }
    declare: { title: string; subtitle: string }
  }
  labels: {
    numAdhesion: string
    numAdhesionHint: string
    dateEntree: string
    celluleLocale: string
    zoneRegion: string
    paysRegion: string
    nom: string
    prenoms: string
    dateNaissance: string
    lieuNaissance: string
    cni: string
    nationalite: string
    adresse: string
    tel: string
    whatsapp: string
    email: string
    profession: string
    domaines: string
    autreProfession: string
    optional: string
    montant: string
    canal: string
  }
  placeholders: {
    numAdhesion: string
    celluleLocale: string
    zoneRegion: string
    paysRegion: string
    tel: string
    email: string
    autreProfession: string
    montantAutre: string
  }
  light: {
    intro: { before: string; brand: string; after: string }
    steps: [string, string]
    sections: {
      identity: { title: string; subtitle: string }
      contrib: { title: string; subtitle: string }
    }
    payment: {
      title: string
      subtitle: string
      cancel: string
      errorNoPayment: string
    }
    actions: { submit: string }
  }
  afterPayment: {
    thanks: string
    complete: string
    later: string
    completeHint: string
  }
  complete: {
    intro: string
    telHint: string
    submit: string
    doneTitle: string
    doneSubtitle: string
    home: string
    pageTitle: string
  }
  montants: {
    perMonth: string
    autre: string
    autreSub: string
  }
  canaux: {
    waveSub: string
    orangeSub: string
    cellule: string
    celluleSub: string
    paydunya: string
    paydunyaSub: string
  }
  domaines: Record<string, string>
  declaration: {
    p1Before: string
    p1After: string
    p2: string
    p3: string
    agree: string
  }
  actions: {
    submit: string
    submitting: string
    print: string
    required: string
  }
  alerts: {
    saveFailed: string
    network: string
  }
  defaults: {
    nationalite: string
  }
  errors: Record<string, string>
    success: {
      title: string
      subtitle: string
      idLabel: string
      qrLabel: string
      qrError: string
      member: string
      cell: string
      dues: string
      downloadQr: string
      downloadCard: string
      whatsapp: string
      reset: string
      cardTitle: string
      cardSlogan: string
      cardDate: string
      cardFooter: string
      whatsappMsg: string
      payNow: string
      payHint: string
    }
}

const domainesFr: Record<string, string> = {
  Artisanat: "Artisanat",
  "Métiers du Bâtiment": "Métiers du Bâtiment",
  Informatique: "Informatique",
  "Systèmes d'Information": "Systèmes d'Information",
  Santé: "Santé",
  "Action Sociale": "Action Sociale",
  "Sciences Religieuses": "Sciences Religieuses",
  Éducation: "Éducation",
  "Gestion de Projet": "Gestion de Projet",
  Management: "Management",
  Agriculture: "Agriculture",
  "Élevage / Rural": "Élevage / Rural",
  Communication: "Communication",
  "Stratégie Médias": "Stratégie Médias",
  Transport: "Transport",
  "Logistique Urbaine": "Logistique Urbaine",
  Droit: "Droit",
  "Ingénierie Institutionnelle": "Ingénierie Institutionnelle",
}

const domainesAr: Record<string, string> = {
  Artisanat: "الحرف اليدوية",
  "Métiers du Bâtiment": "مهن البناء",
  Informatique: "الإعلاميات",
  "Systèmes d'Information": "نظم المعلومات",
  Santé: "الصحة",
  "Action Sociale": "العمل الاجتماعي",
  "Sciences Religieuses": "العلوم الدينية",
  Éducation: "التربية والتعليم",
  "Gestion de Projet": "إدارة المشاريع",
  Management: "التسيير",
  Agriculture: "الزراعة",
  "Élevage / Rural": "تربية المواشي / الريفي",
  Communication: "الاتصال",
  "Stratégie Médias": "استراتيجية الإعلام",
  Transport: "النقل",
  "Logistique Urbaine": "اللوجستيك الحضري",
  Droit: "القانون",
  "Ingénierie Institutionnelle": "الهندسة المؤسسية",
}

const errorsFr: Record<string, string> = {
  "Indiquez votre cellule locale": "Indiquez votre cellule locale",
  "Indiquez votre zone / région": "Indiquez votre zone / région",
  "Nom requis": "Nom requis",
  "Prénom(s) requis": "Prénom(s) requis",
  "Date de naissance requise": "Date de naissance requise",
  "N° CNI / Passeport requis": "N° CNI / Passeport requis",
  "Nationalité requise": "Nationalité requise",
  "Adresse requise": "Adresse requise",
  "Téléphone requis": "Téléphone requis",
  "Email invalide": "Email invalide",
  "Profession requise": "Profession requise",
  "Choisissez un montant": "Choisissez un montant",
  "Choisissez un canal de paiement": "Choisissez un canal de paiement",
  "Vous devez accepter la déclaration": "Vous devez accepter la déclaration",
  "Précisez le montant": "Précisez le montant",
  "Indiquez votre pays ou région": "Indiquez votre pays ou région",
}

const errorsAr: Record<string, string> = {
  "Indiquez votre cellule locale": "يرجى ذكر خليتكم المحلية",
  "Indiquez votre zone / région": "يرجى ذكر منطقتكم / جهتكم",
  "Nom requis": "الاسم مطلوب",
  "Prénom(s) requis": "الاسم الشخصي مطلوب",
  "Date de naissance requise": "تاريخ الميلاد مطلوب",
  "N° CNI / Passeport requis": "رقم بطاقة الهوية / جواز السفر مطلوب",
  "Nationalité requise": "الجنسية مطلوبة",
  "Adresse requise": "العنوان مطلوب",
  "Téléphone requis": "رقم الهاتف مطلوب",
  "Email invalide": "بريد إلكتروني غير صالح",
  "Profession requise": "المهنة مطلوبة",
  "Choisissez un montant": "يرجى اختيار مبلغ",
  "Choisissez un canal de paiement": "يرجى اختيار وسيلة دفع",
  "Vous devez accepter la déclaration": "يجب الموافقة على التصريح",
  "Précisez le montant": "يرجى تحديد المبلغ",
  "Indiquez votre pays ou région": "يرجى ذكر بلدكم أو منطقتكم",
}

export const formDictionaries: Record<Locale, FormDict> = {
  fr: {
    intro: {
      before: "Remplissez cette fiche pour rejoindre votre",
      cell: "Cellule Locale",
      after:
        "et mettre votre compétence au service de la communauté. Les champs marqués * sont obligatoires.",
    },
    steps: ["0", "1", "2", "3", "4"],
    sections: {
      refs: {
        title: "Références d'adhésion",
        subtitle: "Remplies par le coordinateur de la cellule",
      },
      personal: {
        title: "Informations personnelles",
        subtitle: "Vos coordonnées et votre identité",
      },
      skills: {
        title: "Profil professionnel & compétences",
        subtitle: "Programme « 1 Talibé = 1 Compétence »",
      },
      contrib: {
        title: "Modalités de contribution & engagement",
        subtitle: "Cotisation mensuelle obligatoire",
      },
      declare: {
        title: "Déclaration sur l'honneur & Engagement",
        subtitle: "Engagement du membre adhérent",
      },
    },
    labels: {
      numAdhesion: "N° Adhésion",
      numAdhesionHint: "(attribué par la cellule)",
      dateEntree: "Date d'entrée",
      celluleLocale: "Cellule Locale *",
      zoneRegion: "Zone / Région *",
      paysRegion: "Pays ou région *",
      nom: "Nom *",
      prenoms: "Prénom(s) *",
      dateNaissance: "Date de naissance *",
      lieuNaissance: "Lieu de naissance",
      cni: "N° CNI / Passeport *",
      nationalite: "Nationalité *",
      adresse: "Adresse de résidence *",
      tel: "Téléphone principal *",
      whatsapp: "WhatsApp",
      email: "Email",
      profession: "Profession actuelle *",
      domaines:
        "Domaine(s) de compétences à mettre au service de la communauté",
      autreProfession: "Autre profession / expertise",
      optional: "(optionnel)",
      montant: "Montant choisi *",
      canal: "Canal de paiement privilégié *",
    },
    placeholders: {
      numAdhesion: "Ex: AK-2026-000",
      celluleLocale: "Nom de la cellule",
      zoneRegion: "Ex: Touba, Dakar...",
      paysRegion: "Ex: Sénégal, France, Touba, Dakar…",
      tel: "+221 7X XXX XX XX",
      email: "vous@exemple.com",
      autreProfession: "Précisez si votre domaine n'apparaît pas ci-dessus...",
      montantAutre: "Montant en FCFA",
    },
    light: {
      intro: {
        before: "Rejoignez",
        brand: "Ahloul Khidmah",
        after:
          " en quelques clics. Nom, prénom, téléphone, pays et montant — puis payez en ligne.",
      },
      steps: ["1", "2"],
      sections: {
        identity: {
          title: "Vous identifier",
          subtitle: "Nom, prénom, téléphone et pays",
        },
        contrib: {
          title: "Choisir votre montant",
          subtitle: "Cotisation mensuelle",
        },
      },
      payment: {
        title: "Payer en ligne",
        subtitle:
          "Choisissez Wave, Orange Money ou une carte bancaire. Votre badge membre sera disponible après le paiement.",
        cancel: "Modifier mes informations",
        errorNoPayment:
          "Le paiement en ligne est temporairement indisponible. Réessayez plus tard.",
      },
      actions: {
        submit: "Adhérer",
      },
    },
    afterPayment: {
      thanks: "Merci pour votre contribution.",
      complete: "Compléter ma fiche",
      later: "Plus tard",
      completeHint:
        "Vous pouvez compléter votre fiche membre maintenant, ou y revenir plus tard.",
    },
    complete: {
      intro:
        "Quelques informations pour finaliser votre profil membre. Indiquez le même téléphone que lors de l'adhésion.",
      telHint: "Doit correspondre au numéro utilisé lors de l'inscription.",
      submit: "Enregistrer ma fiche",
      doneTitle: "Fiche complétée",
      doneSubtitle: "Merci. Votre dossier membre a été mis à jour.",
      home: "Retour à l'accueil",
      pageTitle: "Compléter ma fiche",
    },
    montants: {
      perMonth: "par mois",
      autre: "Autre montant",
      autreSub: "libre, à préciser",
    },
    canaux: {
      waveSub: "Application mobile",
      orangeSub: "Application mobile",
      cellule: "Versement cellule",
      celluleSub: "Espèces, en cellule locale",
      paydunya: "Payer en ligne",
      paydunyaSub: "Wave, Orange Money ou carte bancaire",
    },
    domaines: domainesFr,
    declaration: {
      p1Before:
        "En signant cette fiche de recensement, je déclare formellement mon adhésion aux principes directeurs d'",
      p1After: ".",
      p2: "Je m'engage à œuvrer avec foi, discipline et esprit de service (Khidmah), sous le leadership moral du Khalif Général des Mourides et sous la direction opérationnelle du Jawrigne.",
      p3: "Je certifie l'exactitude des informations fournies et m'engage à participer régulièrement aux activités et aux cotisations de ma cellule locale.",
      agree:
        "« Lu et approuvé » — J'ai lu et j'accepte les termes de cette déclaration. *",
    },
    actions: {
      submit: "Je rejoins Ahloul Khidmah",
      submitting: "Envoi…",
      print: "Imprimer / PDF",
      required: "* Champs obligatoires",
    },
    alerts: {
      saveFailed: "Impossible d'enregistrer l'adhésion",
      network: "Erreur réseau — réessayez",
    },
    defaults: {
      nationalite: "Sénégalaise",
    },
    errors: errorsFr,
    success: {
      title: "Adhésion enregistrée",
      subtitle:
        "Votre numéro d'identification unique et votre QR code de validation sont prêts. Conservez-les précieusement.",
      idLabel: "N° d'identification",
      qrLabel: "QR code de validation",
      qrError: "Impossible de générer le QR code.",
      member: "Membre",
      cell: "Cellule",
      dues: "Cotisation",
      downloadQr: "Télécharger le QR",
      downloadCard: "Carte PNG",
      whatsapp: "WhatsApp",
      reset: "Remplir une nouvelle fiche",
      cardTitle: "Carte de validation",
      cardSlogan: "1 Talibé = 1 Compétence",
      cardDate: "Adhésion du",
      cardFooter: "Présentez ce QR code pour validation",
      whatsappMsg:
        "Assalamu alaykum,\nVoici ma fiche d'adhésion Ahloul Khidma.\nN° identification: {id}\nNom: {name}\nCellule: {cell}\nValidation: {url}",
      payNow: "Payer ma cotisation (PayDunya)",
      payHint:
        "Vous serez redirigé vers PayDunya (Wave, Orange Money, carte bancaire).",
    },
  },
  ar: {
    intro: {
      before: "املأوا هذه الاستمارة للانضمام إلى",
      cell: "خليتكم المحلية",
      after:
        "ووضع كفاءتكم في خدمة الجماعة. الحقول المعلّمة بـ * إلزامية.",
    },
    steps: ["٠", "١", "٢", "٣", "٤"],
    sections: {
      refs: {
        title: "مراجع الانضمام",
        subtitle: "يملأها منسّق الخلية",
      },
      personal: {
        title: "المعلومات الشخصية",
        subtitle: "بياناتكم وهويتكم",
      },
      skills: {
        title: "الملف المهني والكفاءات",
        subtitle: "برنامج « مريد واحد = كفاءة واحدة »",
      },
      contrib: {
        title: "طرق المساهمة والالتزام",
        subtitle: "اشتراك شهري إلزامي",
      },
      declare: {
        title: "التصريح بالشرف والالتزام",
        subtitle: "التزام العضو المنضمّ",
      },
    },
    labels: {
      numAdhesion: "رقم الانضمام",
      numAdhesionHint: "(تمنحه الخلية)",
      dateEntree: "تاريخ الدخول",
      celluleLocale: "الخلية المحلية *",
      zoneRegion: "المنطقة / الجهة *",
      paysRegion: "البلد أو المنطقة *",
      nom: "الاسم العائلي *",
      prenoms: "الاسم الشخصي *",
      dateNaissance: "تاريخ الميلاد *",
      lieuNaissance: "مكان الميلاد",
      cni: "رقم بطاقة الهوية / جواز السفر *",
      nationalite: "الجنسية *",
      adresse: "عنوان الإقامة *",
      tel: "الهاتف الرئيسي *",
      whatsapp: "واتساب",
      email: "البريد الإلكتروني",
      profession: "المهنة الحالية *",
      domaines: "مجال(ات) الكفاءة لخدمة الجماعة",
      autreProfession: "مهنة / خبرة أخرى",
      optional: "(اختياري)",
      montant: "المبلغ المختار *",
      canal: "وسيلة الدفع المفضّلة *",
    },
    placeholders: {
      numAdhesion: "مثال: AK-2026-000",
      celluleLocale: "اسم الخلية",
      zoneRegion: "مثال: طوبى، داكار...",
      paysRegion: "مثال: السنغال، فرنسا، طوبى، داكار…",
      tel: "+221 7X XXX XX XX",
      email: "vous@exemple.com",
      autreProfession: "وضّحوا إن لم يظهر مجالكم أعلاه...",
      montantAutre: "المبلغ بالفرنك الأفريقي",
    },
    light: {
      intro: {
        before: "انضموا إلى",
        brand: "أهل الخدمة",
        after:
          " ببضع نقرات. الاسم والهاتف والبلد والمبلغ — ثم الدفع أونلاين.",
      },
      steps: ["١", "٢"],
      sections: {
        identity: {
          title: "تعرّفوا على أنفسكم",
          subtitle: "الاسم والهاتف والبلد",
        },
        contrib: {
          title: "اختيار المبلغ",
          subtitle: "الاشتراك الشهري",
        },
      },
      payment: {
        title: "الدفع أونلاين",
        subtitle:
          "اختاروا Wave أو Orange Money أو بطاقة بنكية. ستتوفر بطاقة العضوية بعد الدفع.",
        cancel: "تعديل معلوماتي",
        errorNoPayment:
          "الدفع أونلاين غير متاح مؤقتاً. حاولوا لاحقاً.",
      },
      actions: {
        submit: "انضم",
      },
    },
    afterPayment: {
      thanks: "شكراً لمساهمتكم.",
      complete: "إكمال استمارتي",
      later: "لاحقاً",
      completeHint:
        "يمكنكم إكمال استمارة العضوية الآن، أو العودة إليها لاحقاً.",
    },
    complete: {
      intro:
        "بعض المعلومات لإتمام ملف عضويتكم. استخدموا نفس رقم الهاتف المستخدم عند الانضمام.",
      telHint: "يجب أن يطابق الرقم المستخدم عند التسجيل.",
      submit: "حفظ استمارتي",
      doneTitle: "تم إكمال الاستمارة",
      doneSubtitle: "شكراً. تم تحديث ملف عضويتكم.",
      home: "العودة إلى الصفحة الرئيسية",
      pageTitle: "إكمال استمارتي",
    },
    montants: {
      perMonth: "شهرياً",
      autre: "مبلغ آخر",
      autreSub: "حر، يُحدَّد",
    },
    canaux: {
      waveSub: "تطبيق الهاتف",
      orangeSub: "تطبيق الهاتف",
      cellule: "دفع في الخلية",
      celluleSub: "نقداً، في الخلية المحلية",
      paydunya: "الدفع أونلاين",
      paydunyaSub: "Wave أو Orange Money أو بطاقة بنكية",
    },
    domaines: domainesAr,
    declaration: {
      p1Before:
        "بتوقيع هذه الاستمارة، أصرّح رسمياً بانضمامي إلى المبادئ التوجيهية لـ",
      p1After: ".",
      p2: "ألتزم بالعمل بإيمان وانضباط وروح خدمة (خدمة)، تحت القيادة المعنوية للخليفة العام للمريدين والتوجيه العملي للجاورغن.",
      p3: "أشهد بصحة المعلومات المقدمة وألتزم بالمشاركة المنتظمة في أنشطة واشتراكات خليتي المحلية.",
      agree: "« مقروء وموافق عليه » — قرأتُ وأوافق على بنود هذا التصريح. *",
    },
    actions: {
      submit: "أنضمّ إلى أهل الخدمة",
      submitting: "جاري الإرسال…",
      print: "طباعة / PDF",
      required: "* حقول إلزامية",
    },
    alerts: {
      saveFailed: "تعذّر تسجيل الانضمام",
      network: "خطأ في الشبكة — أعيدوا المحاولة",
    },
    defaults: {
      nationalite: "سنغالية",
    },
    errors: errorsAr,
    success: {
      title: "تم تسجيل الانضمام",
      subtitle:
        "رقم التعريف الفريد ورمز الاستجابة السريعة للتحقق جاهزان. احتفظوا بهما بعناية.",
      idLabel: "رقم التعريف",
      qrLabel: "رمز التحقق QR",
      qrError: "تعذّر إنشاء رمز QR.",
      member: "العضو",
      cell: "الخلية",
      dues: "الاشتراك",
      downloadQr: "تحميل رمز QR",
      downloadCard: "بطاقة PNG",
      whatsapp: "واتساب",
      reset: "ملء استمارة جديدة",
      cardTitle: "بطاقة التحقق",
      cardSlogan: "مريد واحد = كفاءة واحدة",
      cardDate: "انضمام بتاريخ",
      cardFooter: "قدّموا رمز QR هذا للتحقق",
      whatsappMsg:
        "السلام عليكم،\nهذه استمارة انضمامي إلى أهل الخدمة.\nرقم التعريف: {id}\nالاسم: {name}\nالخلية: {cell}\nالتحقق: {url}",
      payNow: "ادفع اشتراكي (PayDunya)",
      payHint:
        "سيتم توجيهكم إلى PayDunya (Wave، Orange Money، بطاقة بنكية).",
    },
  },
}

export function getFormDict(locale: Locale): FormDict {
  return formDictionaries[locale]
}

export function translateFormError(
  message: string | undefined,
  dict: FormDict
): string | undefined {
  if (!message) return undefined
  return dict.errors[message] ?? message
}
