import { atomWithStorage } from "jotai/utils";

export const loginCredentialAtom = atomWithStorage<
  | {
      username: string;
      password: string;
    }
  | undefined
>("credential", undefined);
