import { SITE } from "@/lib/site/info";

export type FaqItem = { question: string; answer: string[] };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

/**
 * Frequently asked questions. Each answer is a list of paragraphs. Keep the
 * copy in step with the product: every step named here must match a real
 * control in the application.
 */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "general",
    title: "Sobre el sitio",
    items: [
      {
        question: `¿Qué es ${SITE.name}?`,
        answer: [
          "Es un sitio para llevar el control de tus álbumes de láminas. Eliges un álbum, marcas las láminas que ya tienes y el sitio te muestra tu avance, las que te faltan y las que tienes repetidas.",
        ],
      },
      {
        question: "¿Tiene algún costo?",
        answer: ["No. Usar el sitio es gratis."],
      },
      {
        question: "¿Necesito una cuenta?",
        answer: [
          "Sí, para guardar tu colección necesitas crear una cuenta con un nombre de usuario, un correo y una contraseña.",
          "Para ver una colección que alguien te compartió con un enlace público no necesitas cuenta.",
        ],
      },
      {
        question: "¿El sitio vende o entrega láminas?",
        answer: [
          `No. ${SITE.name} solo sirve para registrar tu colección. No vende láminas ni álbumes y no tiene relación con las editoriales que los publican.`,
        ],
      },
    ],
  },
  {
    id: "coleccion",
    title: "Tu colección",
    items: [
      {
        question: "¿Cómo agrego un álbum?",
        answer: [
          "Entra a «Explorar álbumes», busca el álbum y presiona «Añadir a mi colección». Desde ese momento aparece en «Mis álbumes».",
        ],
      },
      {
        question: "¿Cómo marco las láminas que tengo?",
        answer: [
          "Abre el álbum y usa el botón de sumar de cada lámina para añadir una copia y el botón de restar para quitarla. En el teléfono basta con tocar la lámina para añadir una copia.",
          "Si sumas más de una copia, la lámina queda marcada como repetida y muestra cuántas tienes.",
        ],
      },
      {
        question: "¿Cómo veo solo las que me faltan o las repetidas?",
        answer: [
          "Sobre las láminas hay un filtro con tres opciones: «Todas», «Faltantes» y «Repetidas». También puedes cambiar entre la vista «Mosaico» y la vista «Lista».",
        ],
      },
      {
        question: "No encuentro el álbum que colecciono. ¿Qué hago?",
        answer: [
          `El catálogo de álbumes lo carga el equipo del sitio. Si falta el tuyo, escríbenos a ${SITE.contactEmail} con el nombre del álbum, la editorial y el año.`,
        ],
      },
      {
        question: "¿Puedo quitar un álbum de mi colección?",
        answer: [
          "Sí. Dentro del álbum abre «Compartir y opciones» y elige «Quitar de mi colección». Al hacerlo se borra el registro de las láminas que habías marcado en ese álbum.",
        ],
      },
    ],
  },
  {
    id: "compartir",
    title: "Compartir e intercambiar",
    items: [
      {
        question: "¿Cómo comparto mi colección?",
        answer: [
          "Dentro del álbum abre «Compartir y opciones» y presiona «Activar enlace público». Se genera un enlace que puedes enviar a quien quieras.",
          "Quien abra ese enlace ve tu avance, tus láminas faltantes y tus repetidas, sin necesidad de tener cuenta.",
        ],
      },
      {
        question: "¿Puedo dejar de compartirla?",
        answer: [
          "Sí. En el mismo lugar puedes desactivar el enlace y deja de funcionar de inmediato.",
        ],
      },
      {
        question: "¿Puedo intercambiar láminas dentro del sitio?",
        answer: [
          "No. El sitio no gestiona intercambios, ventas ni envíos. El enlace público sirve para que tú y otra persona comparen faltantes y repetidas y coordinen el intercambio por su cuenta.",
        ],
      },
    ],
  },
  {
    id: "cuenta",
    title: "Tu cuenta",
    items: [
      {
        question: "¿Puede usarlo un niño o una niña?",
        answer: [
          "Sí, con la autorización de su madre, padre o tutor. Al crear la cuenta se puede indicar que el correo pertenece a esa persona adulta, que es lo que recomendamos para menores de edad.",
        ],
      },
      {
        question: "Olvidé mi contraseña. ¿Cómo la recupero?",
        answer: [
          `Por ahora no hay recuperación automática. Escríbenos a ${SITE.contactEmail} desde el correo con el que registraste la cuenta e indícanos tu nombre de usuario.`,
        ],
      },
      {
        question: "¿Cómo elimino mi cuenta y mis datos?",
        answer: [
          `Escríbenos a ${SITE.contactEmail} desde el correo de la cuenta y la eliminaremos junto con tus colecciones.`,
        ],
      },
      {
        question: "¿Cómo cambio entre tema claro y oscuro?",
        answer: ["Con el botón de sol o luna que está en la parte superior de cada página."],
      },
    ],
  },
];
