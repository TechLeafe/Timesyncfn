import { strToU8, zipSync } from "fflate";

type ExcelCell = string | number;

interface ExcelDownloadOptions {
  rows: ExcelCell[][];
  fileName: string;
  sheetName: string;
  columnWidths: number[];
}

const getColumnName = (index: number) => {
  let name = "";
  let column = index + 1;

  while (column > 0) {
    const remainder = (column - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    column = Math.floor((column - 1) / 26);
  }

  return name;
};

const escapeXml = (value: string) =>
  Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return (
        codePoint === 0x09 ||
        codePoint === 0x0a ||
        codePoint === 0x0d ||
        (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      );
    })
    .join("")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const createWorkbook = ({
  rows,
  sheetName,
  columnWidths,
}: Pick<ExcelDownloadOptions, "rows" | "sheetName" | "columnWidths">) => {
  const sheetRows = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map(
            (value, columnIndex) =>
              `<c r="${getColumnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`
          )
          .join("")}</row>`
    )
    .join("");
  const lastColumn = getColumnName(
    Math.max(0, columnWidths.length - 1)
  );
  const lastRow = Math.max(rows.length, 1);
  const columnXml = columnWidths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
    )
    .join("");
  const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${columnXml}</cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${lastColumn}${lastRow}"/></worksheet>`;

  return zipSync({
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
    ),
    "xl/worksheets/sheet1.xml": strToU8(worksheetXml),
  });
};

export const downloadExcelFile = (options: ExcelDownloadOptions) => {
  const workbook = createWorkbook(options);
  const workbookBuffer = new ArrayBuffer(workbook.byteLength);
  new Uint8Array(workbookBuffer).set(workbook);
  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = options.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
};
