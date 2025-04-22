export type UserDecodedToken = {
  userId: string;
  email: string;
  username: string;
  exp: number;
  iat: number;
};
