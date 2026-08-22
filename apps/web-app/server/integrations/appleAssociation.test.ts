import { beforeEach, afterEach, describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { ENV } from "../_core/env";
import { APPLE_ASSOCIATION_PATH, registerAppleAssociationRoute } from "./appleAssociation";

const originalEnv = { ...ENV };

beforeEach(() => Object.assign(ENV, originalEnv, { appleAppId: "TEAMID.com.example.spatial" }));
afterEach(() => Object.assign(ENV, originalEnv));

describe("Apple association route", () => {
  it("registers the standard path and serves a non-secret JSON association document", () => {
    let registeredPath = "";
    let handler: ((req: Request, res: Response) => void) | undefined;
    registerAppleAssociationRoute({
      get(path, routeHandler) {
        registeredPath = path;
        handler = routeHandler;
      },
    });

    const response = {
      type: (value: string) => {
        expect(value).toBe("application/json");
        return response;
      },
      send: (payload: unknown) => {
        expect(payload).toEqual({
          applinks: {
            details: [{ appIDs: ["TEAMID.com.example.spatial"], components: [{ "/": "/spatial/*" }, { "/": "/app/geospatial/*" }] }],
          },
        });
      },
    };

    expect(registeredPath).toBe(APPLE_ASSOCIATION_PATH);
    handler?.({} as Request, response as unknown as Response);
  });
});
