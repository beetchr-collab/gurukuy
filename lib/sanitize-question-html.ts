import DOMPurify from "isomorphic-dompurify";

const mathMlTags = [
  "math",
  "mrow",
  "mi",
  "mn",
  "mo",
  "mfrac",
  "msqrt",
  "mroot",
  "msup",
  "msub",
  "msubsup",
  "mtext",
  "mspace",
  "mfenced",
  "menclose",
  "mover",
  "munder",
  "munderover",
  "mpadded",
  "mphantom",
  "mtable",
  "mtr",
  "mtd",
  "maligngroup",
  "malignmark",
  "mlongdiv",
  "mscarries",
  "mscarry",
  "msgroup",
  "msline",
  "msrow",
];

const mathMlAttributes = [
  "xmlns",
  "display",
  "mathvariant",
  "stretchy",
  "fence",
  "separator",
  "accent",
  "largeop",
  "movablelimits",
  "lspace",
  "rspace",
  "voffset",
  "linethickness",
  "scriptlevel",
  "displaystyle",
  "mathsize",
  "mathcolor",
  "mathbackground",
  "width",
  "height",
  "rowspan",
  "columnspan",
  "columnalign",
  "rowalign",
  "encoding",
];

const decodeEscapedMathMarkup = (html: string) => {
  let decoded = html;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!/(?:&amp;)*&lt;(?:span\b|math\b)/i.test(decoded)) break;
    decoded = decoded
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'");
  }
  return decoded;
};

export const sanitizeQuestionHtml = (html: string) =>
  DOMPurify.sanitize(decodeEscapedMathMarkup(html), {
    ADD_TAGS: mathMlTags,
    ADD_ATTR: mathMlAttributes,
  });
