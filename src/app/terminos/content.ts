import { SITE } from "@/lib/site/info";

export type TermsSection = { id: string; title: string; paragraphs: string[]; list?: string[] };

/** Date of the last change to the terms, shown at the top of the page. */
export const TERMS_UPDATED = "11 de noviembre de 2026";

/**
 * Terms and conditions. Plain-language draft: every statement about what the
 * site stores or does must stay true to the product. Review with a lawyer
 * before relying on it.
 */
export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "quienes-somos",
    title: "1. Quiénes somos",
    paragraphs: [
      `${SITE.name} es un sitio web para llevar el registro de colecciones de láminas de álbumes. Es operado por ${SITE.owner}, persona natural, desde ${SITE.country}. Puedes escribirnos a ${SITE.contactEmail}.`,
      `${SITE.name} es un proyecto independiente. No está afiliado, patrocinado ni respaldado por las editoriales, marcas, ligas o titulares de derechos de los álbumes que aparecen en el catálogo.`,
    ],
  },
  {
    id: "aceptacion",
    title: "2. Aceptación de estos términos",
    paragraphs: [
      "Al crear una cuenta o usar el sitio aceptas estos términos. Si no estás de acuerdo con ellos, no uses el sitio.",
    ],
  },
  {
    id: "servicio",
    title: "3. Qué ofrece el sitio",
    paragraphs: [
      "El sitio te permite añadir álbumes del catálogo a tu colección, marcar las láminas que tienes, ver las que te faltan y las repetidas, y compartir ese estado mediante un enlace público.",
      "El uso del sitio es gratuito. El sitio no vende láminas ni álbumes, y no gestiona intercambios, pagos ni envíos entre usuarios. Cualquier intercambio que acuerdes con otra persona es de exclusiva responsabilidad de quienes participan en él.",
    ],
  },
  {
    id: "cuenta",
    title: "4. Tu cuenta",
    paragraphs: [
      "Para guardar tu colección necesitas una cuenta. Eres responsable de mantener tu contraseña en reserva y de la actividad que ocurra en tu cuenta. Los datos que entregues al registrarte deben ser verdaderos.",
      "Los menores de edad pueden usar el sitio solo con la autorización de su madre, padre o tutor. En ese caso, el correo de la cuenta debe ser el de esa persona adulta, quien acepta estos términos en nombre del menor.",
    ],
  },
  {
    id: "uso",
    title: "5. Uso permitido",
    paragraphs: ["Al usar el sitio te comprometes a no:"],
    list: [
      "usar un nombre de usuario ofensivo o que suplante a otra persona o marca;",
      "intentar acceder a cuentas o datos de otras personas;",
      "interferir con el funcionamiento del sitio o usarlo de forma automatizada sin autorización;",
      "usar el sitio para fines ilegales.",
    ],
  },
  {
    id: "compartir",
    title: "6. Enlaces públicos",
    paragraphs: [
      "Si activas el enlace público de un álbum, cualquier persona que tenga ese enlace podrá ver el avance, las láminas faltantes y las repetidas de esa colección sin iniciar sesión. Tú decides a quién se lo entregas y puedes desactivarlo cuando quieras.",
    ],
  },
  {
    id: "datos",
    title: "7. Datos personales",
    paragraphs: ["Para funcionar, el sitio guarda:"],
    list: [
      "tu nombre de usuario y tu correo electrónico, junto con la indicación de a quién pertenece ese correo;",
      "tu contraseña, almacenada de forma protegida (hash), de modo que no podemos leerla;",
      "los álbumes de tu colección y las láminas que marcas en ellos;",
      "una cookie de sesión, necesaria para mantenerte conectado.",
    ],
  },
  {
    id: "uso-datos",
    title: "8. Cómo usamos tus datos",
    paragraphs: [
      "Usamos estos datos únicamente para operar el sitio y para responderte si nos escribes. No vendemos tus datos ni los entregamos a terceros con fines publicitarios. El sitio se aloja en proveedores de infraestructura que procesan los datos por encargo nuestro.",
      `Puedes pedir que corrijamos o eliminemos tu cuenta y tus datos escribiendo a ${SITE.contactEmail} desde el correo registrado en la cuenta.`,
    ],
  },
  {
    id: "contenido",
    title: "9. Contenido y marcas",
    paragraphs: [
      "Los nombres de álbumes, editoriales y colecciones que aparecen en el catálogo pertenecen a sus respectivos titulares y se mencionan solo para identificar cada álbum. Si eres titular de derechos y crees que algún contenido debe corregirse o retirarse, escríbenos.",
    ],
  },
  {
    id: "disponibilidad",
    title: "10. Disponibilidad y responsabilidad",
    paragraphs: [
      "El sitio se ofrece tal como está, sin garantía de disponibilidad continua ni de ausencia de errores. Podemos modificar, suspender o cerrar el sitio o partes de él.",
      "En la medida que la ley lo permita, no respondemos por la pérdida de la información de tu colección ni por los acuerdos que realices con otras personas a partir de lo que compartas.",
    ],
  },
  {
    id: "suspension",
    title: "11. Suspensión de cuentas",
    paragraphs: [
      "Podemos bloquear o eliminar una cuenta que incumpla estos términos. Tú puedes dejar de usar el sitio y pedir la eliminación de tu cuenta en cualquier momento.",
    ],
  },
  {
    id: "cambios",
    title: "12. Cambios a estos términos",
    paragraphs: [
      "Podemos actualizar estos términos. La fecha de la última actualización aparece al inicio de esta página. Si sigues usando el sitio después de un cambio, se entiende que aceptas la versión vigente.",
    ],
  },
  {
    id: "ley",
    title: "13. Ley aplicable",
    paragraphs: [
      `Estos términos se rigen por las leyes de la República de ${SITE.country}.`,
    ],
  },
];
