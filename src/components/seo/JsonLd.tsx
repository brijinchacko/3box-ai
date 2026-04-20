/**
 * Reusable JSON-LD injector for SEO structured data.
 *
 * Usage:
 *   <JsonLd data={schemaObject} />
 *   <JsonLd data={[schemaOne, schemaTwo]} />  // Multiple schemas
 *
 * Renders a <script type="application/ld+json"> tag containing the serialized
 * structured data. Google + Bing + AI answer engines use this to understand
 * page content (shows rich results, "People Also Ask", FAQ snippets, etc.).
 */
interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
