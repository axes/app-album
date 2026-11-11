import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ProsePage, ProseSection } from "@/components/ui/prose-page";
import { SiteFooter } from "@/components/ui/site-footer";
import { SITE } from "@/lib/site/info";
import { FAQ_GROUPS } from "./content";

export const metadata: Metadata = {
  title: `Preguntas frecuentes · ${SITE.name}`,
  description: `Respuestas a las dudas más comunes sobre ${SITE.name}: cuenta, colección, láminas y enlaces compartidos.`,
};

export default function FaqPage() {
  return (
    <AppShell footer={<SiteFooter />}>
      <ProsePage>
        <PageHeader
          title="Preguntas frecuentes"
          description={`Lo que más nos preguntan sobre ${SITE.name}.`}
        />
        {FAQ_GROUPS.map((group) => (
          <ProseSection key={group.id} id={group.id} title={group.title}>
            <dl className="flex flex-col gap-5">
              {group.items.map((item) => (
                <div key={item.question} className="flex flex-col gap-1.5">
                  <dt className="text-base font-semibold text-content">{item.question}</dt>
                  <dd className="flex flex-col gap-2 text-muted">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </ProseSection>
        ))}
        <p className="type-small text-muted">
          ¿No encontraste tu respuesta? Escríbenos a{" "}
          <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${SITE.contactEmail}`}>
            {SITE.contactEmail}
          </a>{" "}
          o revisa los{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/terminos">
            términos y condiciones
          </Link>
          .
        </p>
      </ProsePage>
    </AppShell>
  );
}
