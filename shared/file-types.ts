export const ALLOWED_SOURCE_EXTENSIONS = [
  ".js",
  ".ts",
  ".py",
  ".html",
  ".css",
  ".rs",
  ".go",
  ".java",
  ".cpp",
] as const;

export const SOURCE_FILE_UPLOAD_MAX_BYTES = 1024 * 1024;
export const SOURCE_FILE_ACCEPT = ALLOWED_SOURCE_EXTENSIONS.join(",");
export const SOURCE_FILE_FORMATS_LABEL = ALLOWED_SOURCE_EXTENSIONS.join(", ");

export function isAllowedSourceFile(filename: string): boolean {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return ALLOWED_SOURCE_EXTENSIONS.includes(extension as (typeof ALLOWED_SOURCE_EXTENSIONS)[number]);
}
