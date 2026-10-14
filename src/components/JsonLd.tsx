/** Structured data for search engines (schema.org), safe to put in the page */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // "<" escaped so text in the data can never close the script tag
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
