export const useSeoPage = (options: {
  title?: string | (() => string);
  description?: string | (() => string);
  private?: boolean;
}) => {
  useSeoMeta({
    title: options.title as any,
    description: options.description as any,
    robots: options.private ? "noindex, nofollow" : undefined,
  });
};
