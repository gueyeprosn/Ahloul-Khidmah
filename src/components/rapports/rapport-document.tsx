import Image from "next/image"
import type { DetailedReport } from "@/lib/rapports-detail"
import { formatDate, formatFcfa } from "@/lib/format"

function money(n: number) {
  return formatFcfa(n)
}

function statusFr(status: string) {
  if (status === "completed") return "Confirmée"
  if (status === "canceled") return "Annulée"
  if (status === "pending") return "En attente"
  return status
}

export function RapportDocument({ report }: { report: DetailedReport }) {
  const { kpis } = report

  return (
    <article id="ak-rapport-pdf" className="ak-rapport">
      {/* En-tête */}
      <header className="ak-rapport-header">
        <div className="ak-rapport-brand">
          <Image
            src="/brand/logo.png"
            alt="Ahloul Khidmah"
            width={64}
            height={64}
            className="ak-rapport-logo"
            priority
          />
          <div>
            <p className="ak-rapport-eyebrow">Ahloul Khidmah</p>
            <h1 className="ak-rapport-title">Rapport organisationnel</h1>
            <p className="ak-rapport-subtitle">
              Période : <strong>{report.periodeLabel}</strong>
            </p>
          </div>
        </div>
        <div className="ak-rapport-meta">
          <p>Document confidentiel — usage interne</p>
          <p>
            Généré le{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(report.generatedAt)}
          </p>
          <p>Réf. AK-RPT-{report.periode.replace("-", "")}</p>
        </div>
      </header>

      <div className="ak-rapport-rule" />

      {/* Synthèse */}
      <section className="ak-rapport-section">
        <h2>1. Synthèse exécutive</h2>
        <div className="ak-rapport-kpi-grid">
          <Kpi label="Adhérents totaux" value={String(kpis.total)} />
          <Kpi label="Actifs" value={String(kpis.actifs)} />
          <Kpi label="Nouveaux (période)" value={String(kpis.nouveaux)} />
          <Kpi label="En attente" value={String(kpis.enAttente)} />
          <Kpi label="Fiches incomplètes" value={String(kpis.fichesIncompletes)} />
          <Kpi label="Archivés" value={String(kpis.archives)} />
          <Kpi label="Collecté (cotisations)" value={money(kpis.collecté)} accent />
          <Kpi label="Engagement mensuel" value={money(kpis.engagement)} />
          <Kpi
            label="Taux de collecte"
            value={kpis.taux !== null ? `${kpis.taux} %` : "—"}
            accent
          />
          <Kpi
            label="Non payé ce mois"
            value={`${kpis.unpaidCount} · ${money(kpis.unpaidAmount)}`}
          />
          <Kpi
            label="Contributions confirmées"
            value={`${kpis.contributionsCount} · ${money(kpis.contributionsAmount)}`}
          />
          <Kpi
            label="Contributions en attente"
            value={String(kpis.contributionsPending)}
          />
        </div>
      </section>

      {/* Canaux */}
      <section className="ak-rapport-section">
        <h2>2. Répartition des canaux</h2>
        <table className="ak-rapport-table">
          <thead>
            <tr>
              <th>Canal</th>
              <th className="num">Engagement actifs</th>
              <th className="num">Collecté (période)</th>
              <th className="num">Taux</th>
            </tr>
          </thead>
          <tbody>
            {report.channels.map((c) => (
              <tr key={c.key}>
                <td>{c.label}</td>
                <td className="num">{money(c.engagement)}</td>
                <td className="num">{money(c.collecté)}</td>
                <td className="num">
                  {c.engagement
                    ? `${Math.round((c.collecté / c.engagement) * 100)} %`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Cellules */}
      <section className="ak-rapport-section">
        <h2>3. Cellules locales</h2>
        {report.cellules.length === 0 ? (
          <p className="ak-rapport-empty">Aucune cellule enregistrée.</p>
        ) : (
          <table className="ak-rapport-table">
            <thead>
              <tr>
                <th>Cellule</th>
                <th>Zone</th>
                <th className="num">Effectif</th>
              </tr>
            </thead>
            <tbody>
              {report.cellules.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.zone}</td>
                  <td className="num">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Zones */}
      <section className="ak-rapport-section">
        <h2>4. Zones / régions (adhérents actifs)</h2>
        {report.zones.length === 0 ? (
          <p className="ak-rapport-empty">Aucune donnée.</p>
        ) : (
          <table className="ak-rapport-table">
            <thead>
              <tr>
                <th>Zone / région</th>
                <th className="num">Effectif</th>
              </tr>
            </thead>
            <tbody>
              {report.zones.map((z) => (
                <tr key={z.zone}>
                  <td>{z.zone}</td>
                  <td className="num">{z.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Nouveaux */}
      <section className="ak-rapport-section ak-rapport-break">
        <h2>5. Nouvelles adhésions — {report.periodeLabel}</h2>
        {report.nouveaux.length === 0 ? (
          <p className="ak-rapport-empty">Aucune nouvelle adhésion sur la période.</p>
        ) : (
          <table className="ak-rapport-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Adhérent</th>
                <th>Cellule</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Fiche</th>
              </tr>
            </thead>
            <tbody>
              {report.nouveaux.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>
                    <div className="strong">{a.name}</div>
                    <div className="muted">{a.id}</div>
                  </td>
                  <td>{a.cellule}</td>
                  <td className="num">{money(a.montant)}</td>
                  <td>{a.status}</td>
                  <td>{a.ficheComplete ? "Complète" : "Incomplète"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Cotisations payées */}
      <section className="ak-rapport-section ak-rapport-break">
        <h2>6. Cotisations encaissées</h2>
        {report.paidRows.length === 0 ? (
          <p className="ak-rapport-empty">
            Aucune cotisation payée pour {report.periodeLabel}.
          </p>
        ) : (
          <table className="ak-rapport-table">
            <thead>
              <tr>
                <th>Adhérent</th>
                <th>Cellule</th>
                <th>Canal</th>
                <th className="num">Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {report.paidRows.map((r) => (
                <tr key={r.id}>
                  <td className="strong">{r.name}</td>
                  <td>{r.cellule}</td>
                  <td>{r.canal}</td>
                  <td className="num">{money(r.montant)}</td>
                  <td>{r.paidAt ? formatDate(r.paidAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Total collecté</strong>
                </td>
                <td className="num">
                  <strong>{money(kpis.collecté)}</strong>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {/* Non payés */}
      <section className="ak-rapport-section">
        <h2>7. Adhérents actifs — non payés ce mois</h2>
        {report.unpaidActifs.length === 0 ? (
          <p className="ak-rapport-empty">
            Tous les adhérents actifs sont à jour pour la période.
          </p>
        ) : (
          <table className="ak-rapport-table">
            <thead>
              <tr>
                <th>Adhérent</th>
                <th>Téléphone</th>
                <th>Cellule</th>
                <th>Canal prévu</th>
                <th className="num">Montant dû</th>
              </tr>
            </thead>
            <tbody>
              {report.unpaidActifs.map((r) => (
                <tr key={r.id}>
                  <td className="strong">{r.name}</td>
                  <td>{r.tel}</td>
                  <td>{r.cellule}</td>
                  <td>{r.canal}</td>
                  <td className="num">{money(r.expected)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>
                  <strong>Total restant</strong>
                </td>
                <td className="num">
                  <strong>{money(kpis.unpaidAmount)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {/* Contributions */}
      <section className="ak-rapport-section ak-rapport-break">
        <h2>8. Contributions (dons hors adhésion)</h2>
        {report.contributions.length === 0 ? (
          <p className="ak-rapport-empty">
            Aucune contribution enregistrée sur la période.
          </p>
        ) : (
          <table className="ak-rapport-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Contributeur</th>
                <th>Campagne</th>
                <th>Statut</th>
                <th className="num">Montant</th>
              </tr>
            </thead>
            <tbody>
              {report.contributions.map((c) => (
                <tr key={c.id}>
                  <td>{formatDate(c.createdAt)}</td>
                  <td className="strong">{c.name}</td>
                  <td>{c.campagne}</td>
                  <td>{statusFr(c.status)}</td>
                  <td className="num">{money(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="ak-rapport-footer">
        <div className="ak-rapport-rule" />
        <p>
          Ahloul Khidmah — La Communauté des Serviteurs · Touba, Sénégal
        </p>
        <p>
          Servir Serigne Touba avec Foi, Discipline, Savoir et Excellence ·{" "}
          www.ahloulkhidmah.org
        </p>
      </footer>
    </article>
  )
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`ak-rapport-kpi${accent ? " accent" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
