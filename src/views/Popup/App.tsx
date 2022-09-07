import React, { useEffect, useState } from "react";
import { Router } from "react-chrome-extension-router";
import { useSelector } from "react-redux";
import { useTheme } from "@geist-ui/react";
import { browser } from "webextension-polyfill-ts";
import { RootState } from "../../stores/reducers";

import Home from "./routes/Home";
import FakeReporting from "./routes/FakeReporting";
import Arweave from "arweave";
import { fakeNewsContractId } from "../../utils/constants";
import { SmartWeaveWebFactory } from "redstone-smartweave";
import { JWKInterface } from "arbundles/src/interface-jwk";
import { getActiveKeyfile } from "../../utils/background";

export default function App() {
  const wallets = useSelector((state: RootState) => state.wallets),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    storedBalances = useSelector((state: RootState) => state.balances),
    arweave = new Arweave(arweaveConfig),
    profile = useSelector((state: RootState) => state.profile),
    psts = useSelector((state: RootState) => state.assets).find(
      ({ address }) => address === profile
    )?.assets,
    [transactions, setTransactions] = useState<
      {
        id: string;
        amount: number;
        type: string;
        status: string;
        timestamp: number;
      }[]
    >([]),
    theme = useTheme(),
    { currency } = useSelector((state: RootState) => state.settings),
    [arPriceInCurrency, setArPriceInCurrency] = useState(1),
    [addressKey, setAddressKey] = useState<JWKInterface>(),
    [loading, setLoading] = useState({ psts: true, txs: true }),
    [currentTabContentType, setCurrentTabContentType] = useState<
      "page" | "pdf" | undefined
    >("page"),
    smartweave = SmartWeaveWebFactory.memCachedBased(arweave).build(),
    fakeContractTxId = "684ld6l9TfLdj4DYszP8l7fOc9kw5x5OuZD3NWuS46Q";

  useEffect(() => {
    if (wallets.length === 0)
      browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadPublicKey();
    // eslint-disable-next-line
  }, [profile]);

  async function loadPublicKey() {
    setAddressKey((await getActiveKeyfile()).keyfile);
  }
  return (
    (wallets.length !== 0 && (
      <Router>
        <FakeReporting
          arweave={arweave}
          smartweave={smartweave}
          fakeContractTxId={fakeContractTxId}
          addressKey={addressKey!}
        />
      </Router>
    )) || (
      <p style={{ textAlign: "center" }}>
        Click{" "}
        <span
          style={{ color: theme.palette.success }}
          onClick={() =>
            browser.tabs.create({
              url: browser.runtime.getURL("/welcome.html")
            })
          }
        >
          here
        </span>{" "}
        if a new window did not open
      </p>
    )
  );
}
