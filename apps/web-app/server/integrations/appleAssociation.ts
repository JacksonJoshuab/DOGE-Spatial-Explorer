import type { Request, Response } from "express";
import { getAppleAppSiteAssociation } from "./ecosystem";

type RouteRegistrar = {
  get: (path: string, handler: (req: Request, res: Response) => void) => unknown;
};

export const APPLE_ASSOCIATION_PATH = "/.well-known/apple-app-site-association";

/** Register the public, non-secret Apple Universal Links association document. */
export function registerAppleAssociationRoute(app: RouteRegistrar) {
  app.get(APPLE_ASSOCIATION_PATH, (_req, res) => {
    res.type("application/json").send(getAppleAppSiteAssociation());
  });
}
