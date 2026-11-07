declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  type PDFParseResult = {
    numpages?: number;
    numrender?: number;
    info?: any;
    metadata?: any;
    text: string;
    version?: string;
  };

  function pdfParse(data: Buffer | Uint8Array | ArrayBuffer | string, options?: any): Promise<PDFParseResult>;

  export = pdfParse;
}
