import type { Locale } from "@/i18n/landing"

export type ContributeDict = {
  eyebrow: string
  title: string
  intro: string
  paths: {
    member: {
      title: string
      text: string
      cta: string
      points: string[]
    }
    contribute: {
      title: string
      text: string
      cta: string
      points: string[]
    }
  }
  form: {
    title: string
    subtitle: string
    identityTitle: string
    identitySubtitle: string
    amountTitle: string
    amountSubtitle: string
    messageTitle: string
    messageSubtitle: string
    prenoms: string
    nom: string
    tel: string
    email: string
    amount: string
    otherAmount: string
    campagne: string
    message: string
    messageHint: string
    anonymous: string
    submit: string
    submitting: string
    note: string
    successTitle: string
    successText: string
    payNow: string
    backHome: string
  }
}

const fr: ContributeDict = {
  eyebrow: "Deux chemins",
  title: "Devenir membre ou simplement contribuer",
  intro:
    "Certains rejoignent Ahloul Khidmah comme membres engagés. D’autres soutiennent les projets par une contribution — les deux donnent accès à une carte de membre, avec ou sans cotisation mensuelle.",
  paths: {
    member: {
      title: "Devenir membre",
      text: "Rejoindre une cellule, déclarer vos compétences et vous engager dans le khidma organisé.",
      cta: "Remplir la fiche d’adhésion",
      points: [
        "Cellule locale & recensement",
        "Cotisation mensuelle",
        "Compétences au service de Touba",
      ],
    },
    contribute: {
      title: "Contribuer",
      text: "Soutenir financièrement les projets, ponctuellement ou selon votre capacité — sans cotisation mensuelle à payer ensuite.",
      cta: "Faire une contribution",
      points: [
        "Montant libre",
        "Paiement sécurisé en ligne",
        "Carte de membre incluse (avec votre téléphone)",
      ],
    },
  },
  form: {
    title: "Votre contribution",
    subtitle:
      "Choisissez un montant. Avec votre téléphone, vous recevrez aussi votre carte de membre — sans cotisation mensuelle.",
    identityTitle: "Vos coordonnées",
    identitySubtitle: "Optionnel si vous restez anonyme",
    amountTitle: "Montant",
    amountSubtitle: "Choisissez le montant de votre soutien",
    messageTitle: "Message",
    messageSubtitle: "Optionnel",
    prenoms: "Prénom(s)",
    nom: "Nom",
    tel: "Téléphone / WhatsApp",
    email: "Email (optionnel)",
    amount: "Montant",
    otherAmount: "Précisez le montant (FCFA)",
    campagne: "Destination",
    message: "Message (optionnel)",
    messageHint: "Une intention, une dédicace, ou un mot pour l’équipe.",
    anonymous: "Je souhaite rester anonyme",
    submit: "Continuer vers le paiement",
    submitting: "Préparation du paiement…",
    note: "Après validation, choisissez Wave, Orange Money (Max it) ou une carte bancaire pour payer.",
    successTitle: "Merci pour votre soutien",
    successText:
      "Choisissez ci-dessous Wave, Orange Money ou une carte bancaire pour finaliser le paiement.",
    payNow: "Payer maintenant",
    backHome: "Retour à l’accueil",
  },
}

const ar: ContributeDict = {
  eyebrow: "مساران",
  title: "الانضمام عضواً أو المساهمة فقط",
  intro:
    "بعضهم ينضم إلى أهل الخدمة أعضاءً ملتزمين. وآخرون يدعمون المشاريع بمساهمة — كلاهما يمنح بطاقة العضوية، مع أو بدون اشتراك شهري.",
  paths: {
    member: {
      title: "الانضمام عضواً",
      text: "الانضمام إلى خلية، والإعلان عن كفاءاتكم، والالتزام بالخدمة المنظمة.",
      cta: "ملء استمارة الانضمام",
      points: [
        "خلية محلية وتسجيل",
        "اشتراك شهري",
        "كفاءات في خدمة طوبى",
      ],
    },
    contribute: {
      title: "المساهمة",
      text: "دعم المشاريع مالياً، مرة واحدة أو حسب قدرتكم — دون اشتراك شهري لاحقاً.",
      cta: "قدّم مساهمة",
      points: [
        "مبلغ حر",
        "دفع آمن عبر الإنترنت",
        "بطاقة عضوية مشمولة (برقم هاتفكم)",
      ],
    },
  },
  form: {
    title: "مساهمتكم",
    subtitle: "اختاروا مبلغاً. برقم هاتفكم، تحصلون أيضاً على بطاقة العضوية — دون اشتراك شهري.",
    identityTitle: "بياناتكم",
    identitySubtitle: "اختياري إن بقيتم مجهولين",
    amountTitle: "المبلغ",
    amountSubtitle: "اختاروا مبلغ دعمكم",
    messageTitle: "رسالة",
    messageSubtitle: "اختياري",
    prenoms: "الاسم الشخصي",
    nom: "اسم العائلة",
    tel: "الهاتف / واتساب",
    email: "البريد (اختياري)",
    amount: "المبلغ",
    otherAmount: "حدّدوا المبلغ (فرنك)",
    campagne: "الوجهة",
    message: "رسالة (اختياري)",
    messageHint: "نية أو إهداء أو كلمة للفريق.",
    anonymous: "أرغب في البقاء مجهولاً",
    submit: "المتابعة إلى الدفع",
    submitting: "جارٍ إعداد الدفع…",
    note: "بعد التأكيد، اختاروا Wave أو Orange Money (Max it) أو بطاقة بنكية للدفع.",
    successTitle: "شكراً لدعمكم",
    successText: "اختاروا أدناه Wave أو Orange Money أو بطاقة بنكية لإتمام الدفع.",
    payNow: "ادفع الآن",
    backHome: "العودة إلى الصفحة الرئيسية",
  },
}

export function getContributeDict(locale: Locale): ContributeDict {
  return locale === "ar" ? ar : fr
}
