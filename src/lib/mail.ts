import nodemailer from "nodemailer"

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  )
}

export function getMailFrom() {
  return (
    process.env.MAIL_FROM?.trim() ||
    `AHLOUL KHIDMAH <${process.env.SMTP_USER?.trim() || "ahloulkhidmah@gmail.com"}>`
  )
}

export function createMailTransport() {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  if (!user || !pass) {
    throw new Error("SMTP non configuré (SMTP_USER / SMTP_PASS)")
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT || "465")
  const secure = process.env.SMTP_SECURE !== "false"

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: {
    filename: string
    content: Buffer
    contentType?: string
  }[]
}) {
  if (!isMailConfigured()) {
    return { ok: false as const, error: "SMTP non configuré" }
  }

  try {
    const transport = createMailTransport()
    const info = await transport.sendMail({
      from: getMailFrom(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })
    return { ok: true as const, messageId: info.messageId }
  } catch (e) {
    console.error("sendMail:", e)
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Erreur envoi email",
    }
  }
}
