import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ProsePage, ProseSection } from "@/components/ui/prose-page";
import { SiteFooter } from "@/components/ui/site-footer";
import { SITE } from "@/lib/site/info";
import { TERMS_SECTIONS, TERMS_UPDATED } from "./content";

export const metadata: Metadata = {
  title: `Términos y condiciones · ${SITE.name}`,
  description: `Condiciones de uso de ${SITE.name} y tratamiento de los datos de las cuentas.`,
};

export default function TermsPage() {
  return (
    <AppShell footer={<SiteFooter />}>
      <ProsePage>
        <PageHeader
          title="Términos y condiciones"
          description={`Última actualización: ${TERMS_UPDATED}.`}
        />
        {TERMS_SECTIONS.map((section) => (
          <ProseSection key={section.id} id={section.id} title={section.title}>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul className="flex list-disc flex-col gap-1.5 pl-5">
                {section.list.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : null}
          </ProseSection>
        ))}
        <p className="type-small text-muted">
          ¿Tienes dudas sobre estos términos? Escríbenos a{" "}
          <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${SITE.contactEmail}`}>
            {SITE.contactEmail}
          </a>{" "}
          o revisa las{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/faq">
            preguntas frecuentes
          </Link>
          .
        </p>
      </ProsePage>
    </AppShell>
  );
}
