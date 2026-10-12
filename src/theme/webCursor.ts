import { Platform } from "react-native";

export const cursorPointer = Platform.select({
  web: { cursor: "pointer" } as any,
  default: {},
});
