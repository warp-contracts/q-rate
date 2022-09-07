import React, { useEffect } from "react";
import { CssBaseline, GeistProvider, Themes } from "@geist-ui/react";
import { Provider as ReduxProvider } from "react-redux";
import { useColorScheme } from "use-color-scheme";
import { PersistGate } from "redux-persist/integration/react";
import { fixupPasswords } from "../utils/auth";
import setupStores from "../stores";

const themeCommon = {
  success: "#5982f1",
  successLight: "#8ea1ed",
  successDark: "#2f55f5",
  link: "#5273fb",
  selection: "#bcc8f5",
  code: "#5982f1"
};

const lightTheme = Themes.createFromLight({
  type: "arconnectlight",
  palette: themeCommon
});

const darkTheme = Themes.createFromDark({
  type: "arconnectdark",
  palette: {
    accents_1: "#111",
    accents_2: "#333",
    accents_3: "#444",
    accents_4: "#666",
    accents_5: "#888",
    accents_6: "#999",
    accents_7: "#eaeaea",
    accents_8: "#fafafa",
    background: "#000",
    foreground: "#fff",
    secondary: "#888",
    border: "#333",
    ...themeCommon
  },
  expressiveness: {
    dropdownBoxShadow: "0 0 0 1px #333",
    shadowSmall: "0 0 0 1px #333",
    shadowMedium: "0 0 0 1px #333",
    shadowLarge: "0 0 0 1px #333",
    portalOpacity: 0.75
  }
});

export default function Provider({ children }: Props) {
  const { scheme } = useColorScheme(),
    { store, persistor } = setupStores();

  useEffect(() => {
    fixupPasswords();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PersistGate persistor={persistor}>
        <GeistProvider
          themeType={"arconnect" + scheme}
          themes={[darkTheme, lightTheme]}
        >
          <CssBaseline />
          {children}
        </GeistProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
