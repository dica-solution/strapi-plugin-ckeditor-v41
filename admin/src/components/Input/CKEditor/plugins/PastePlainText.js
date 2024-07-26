const Plugin = window.CKEditor5.core.Plugin;

const plainTextToHtml = (text) => {
  text = text
    // Encode <>.
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Creates a paragraph for each double line break.
    .replace(/\r?\n\r?\n/g, "</p><p>")
    // Creates a line break for each single line break.
    .replace(/\r?\n/g, "<br>")
    // Replace tabs with four spaces.
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
    // Preserve trailing spaces (only the first and last one – the rest is handled below).
    .replace(/^\s/, "&nbsp;")
    .replace(/\s$/, "&nbsp;")
    // Preserve other subsequent spaces now.
    .replace(/\s\s/g, " &nbsp;");

  if (text.includes("</p><p>") || text.includes("<br>")) {
    // If we created paragraphs above, add the trailing ones.
    text = `<p>${text}</p>`;
  }

  return text;
};

const regexNormal1 = /(\\\[\S*?.+?\S*?\\\])/g;

const regexNormal2 = /(\\\(\S*?.+?\S*?\\\))/g;
const regex$ = /\$(\S*?.+?\S*?)\$/g;

const regex$$ = /\$\$(\S*?.+?\S*?)\$\$/g;
const regex$$n = /\$\$\n(\S*?.+?\S*?)\n\$\$/g;

const cleanHTML = (input) => {
  // Replacement string
  const replacementNormal = '<span class="math-tex">$1</span>';

  const replacement$$ = `<span class="math-tex">\[$1\]</span>`;

  return input
    .replace(regex$$n, replacement$$)
    .replace(regex$$, replacementNormal)
    .replace(regex$, replacementNormal)
    .replace(regexNormal1, replacementNormal)
    .replace(regexNormal2, replacementNormal)
    .replace(
      /<span class="math-tex">(.*?)<\/span>/g,
      function (match, content) {
        return (
          '<span class="math-tex">' + content.replace(/<br>/g, "") + "</span>"
        );
      }
    );
};

export default class PastePlainTextPlugin extends Plugin {
  static get pluginName() {
    return "PastePlainTextPlugin";
  }

  init() {
    const editor = this.editor;

    const editingView = editor.editing.view;

    editingView.document.on("clipboardInput", (evt, data) => {
      const dataTransfer = data.dataTransfer;
      const htmlTextContent = dataTransfer.getData("text/html");

      // const isMatchMSWord =

      const isFomular =
        regexNormal1.test(htmlTextContent) ||
        regexNormal2.test(htmlTextContent) ||
        regex$.test(htmlTextContent) ||
        regex$$.test(htmlTextContent) ||
        regex$$n.test(htmlTextContent);

      //skip content paste from Google docs & paste content from ckeditor was converted -> System handle
      if (
        (!htmlTextContent || isFomular) &&
        !htmlTextContent.includes("math-tex")
      ) {
        const plainTextContent = plainTextToHtml(
          dataTransfer.getData("text/plain")
        );

        const _html = cleanHTML(plainTextContent);
        data.content = this.editor.data.htmlProcessor.toView(_html);
      }
    });
  }
}
