// src/components/SEO.tsx
import { useEffect } from "react";

type Crumb = { name: string; item: string };
type Props = {
  title: string;
  description: string;
  path: string;            // e.g. "/", "/menu"
  image?: string;          // absolute URL recommended in prod
  breadcrumbs?: Crumb[];   // optional
};

const PROD_SITE = "https://beachbumzmhc.com";
const ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : PROD_SITE;
const SITE = ORIGIN || PROD_SITE;
const IS_LOCAL = /^(http:\/\/)?(localhost|127\.0\.0\.1)(:|$)/i.test(SITE);

const ORG = {
  name: "Beach Bumz Pub & Pizzeria",
  phone: "+1-252-726-7800",
  street: "105 South 6th Street",
  city: "Morehead City",
  region: "NC",
  postal: "28557",
  country: "US",
  sameAs: [
    "https://www.instagram.com/beachbumzmc",
    "https://www.facebook.com/p/Beach-Bumz-Pub-Pizzaria-100063510343151/",
  ],
};

function upsert<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  selector: string,
  attrs: Record<string, string>
) {
  let el = document.head.querySelector<HTMLElementTagNameMap[K]>(selector);
  if (!el) {
    el = document.createElement(tag);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  return el!;
}

function jsonScript(id: string, data: unknown) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-${id}="1"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute(`data-${id}`, "1");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function SEO({ title, description, path, image, breadcrumbs }: Props) {
  useEffect(() => {
    const normPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`;
    const canonicalUrl = new URL(normPath.replace(/^\//, ""), SITE).toString();

    // Use local asset during dev to avoid external 404s
    const ogImage = image || (IS_LOCAL ? "/og-image.jpg" : `${PROD_SITE}/og-image.jpg`);

    document.title = title;

    upsert("meta", 'meta[name="description"]', { name: "description", content: description });
    upsert("link", 'link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    // Open Graph
    upsert("meta", 'meta[property="og:type"]', { property: "og:type", content: "website" });
    upsert("meta", 'meta[property="og:title"]', { property: "og:title", content: title });
    upsert("meta", 'meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsert("meta", 'meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsert("meta", 'meta[property="og:image"]', { property: "og:image", content: ogImage });
    upsert("meta", 'meta[property="og:site_name"]', { property: "og:site_name", content: ORG.name });

    // Twitter
    upsert("meta", 'meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsert("meta", 'meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsert("meta", 'meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsert("meta", 'meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

    // Organization
    jsonScript("orgjson", {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE}/#org`,
      name: ORG.name,
      url: SITE,
      telephone: ORG.phone,
      logo: IS_LOCAL ? "/og-image.jpg" : `${PROD_SITE}/og-image.jpg`,
      sameAs: ORG.sameAs,
      address: {
        "@type": "PostalAddress",
        streetAddress: ORG.street,
        addressLocality: ORG.city,
        addressRegion: ORG.region,
        postalCode: ORG.postal,
        addressCountry: ORG.country,
      },
    });

    // Restaurant / LocalBusiness
    jsonScript("restaurantjson", {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": `${SITE}/#restaurant`,
      name: ORG.name,
      url: SITE,
      telephone: ORG.phone,
      priceRange: "$$",
      servesCuisine: ["Pizza", "American", "Wings", "Seafood"],
      menu: `${SITE}/menu/`,
      sameAs: ORG.sameAs,
      address: {
        "@type": "PostalAddress",
        streetAddress: ORG.street,
        addressLocality: ORG.city,
        addressRegion: ORG.region,
        postalCode: ORG.postal,
        addressCountry: ORG.country,
      },
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday"], opens: "11:00", closes: "21:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday","Saturday"], opens: "11:00", closes: "22:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "11:00", closes: "21:00" }
      ]
    });

    // Breadcrumbs (if provided)
    if (breadcrumbs && breadcrumbs.length) {
      jsonScript("breadcrumbsjson", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.item,
        })),
      });
    }
  }, [title, description, path, image, breadcrumbs]);

  return null;
}
