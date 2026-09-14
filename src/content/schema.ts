import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonEmptyString = z.string().min(1);

/**
 * Only slug and name are required. Every other field is optional on purpose: a
 * record that omits one renders without it rather than showing an empty label,
 * and the client's fuller content file drops in without a schema change.
 * Values are never transformed, so what the file says is what the page shows.
 */
export const destinationSchema = z.object({
  slug: nonEmptyString.regex(slugPattern, 'slug must be lower-case words separated by single hyphens'),
  name: nonEmptyString,
  province: nonEmptyString.optional(),
  category: nonEmptyString.optional(),
  bestSeason: nonEmptyString.optional(),
  attractions: z.array(nonEmptyString).optional(),
  travelInformation: nonEmptyString.optional(),
});

export type Destination = z.infer<typeof destinationSchema>;

export const destinationsSchema = z.array(destinationSchema).superRefine((destinations, ctx) => {
  const seen = new Set<string>();
  destinations.forEach((destination, index) => {
    if (seen.has(destination.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'slug'],
        message: `duplicate slug "${destination.slug}"`,
      });
    }
    seen.add(destination.slug);
  });
});

export function formatContentIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('; ');
}
