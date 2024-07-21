export type ContentType = string;
export namespace ContentType {
    let BINARY: string;
    let TEXT: string;
    let HTML: string;
    let JS: string;
    let CSS: string;
    let JSON: string;
    let PNG: string;
    let JPEG: string;
    let GIF: string;
    let SVG: string;
    let APNG: string;
    let WEBP: string;
    let BMP: string;
    let ICO: string;
    let XML: string;
    let PDF: string;
    let ZIP: string;
}
export function getContentTypeByPath(filePath: string): string;
