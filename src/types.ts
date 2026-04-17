export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

export interface JWTPayload {
  username: string;
  exp: number;
}