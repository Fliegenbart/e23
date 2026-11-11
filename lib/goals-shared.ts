/** Target picture and the steps towards it, shared by the API and the client. */
export type Goal = {
  id: string;
  kind: "vision" | "step";
  due: string;
  body: string;
  owner: string;
  done: boolean;
  version: number;
  created: string;
};
