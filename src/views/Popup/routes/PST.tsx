import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowSwitchIcon } from "@primer/octicons-react";
import { goTo } from "react-chrome-extension-router";
import { Asset } from "../../../stores/reducers/assets";
import {
  Input,
  Tabs,
  useInput,
  useTabs,
  Button,
  Spacer
} from "@geist-ui/react";
// @ts-ignore
import { useColorScheme } from "use-color-scheme";
import Verto from "@verto/lib";
import Home from "./Home";
import communityxyz_logo from "../../../assets/communityxyz.png";
import verto_logo_light from "../../../assets/verto_light.png";
import verto_logo_dark from "../../../assets/verto_dark.png";
import styles from "../../../styles/views/Popup/PST.module.sass";

export default function PST({ id, name, balance, ticker }: Asset) {
  const [arPrice, setArPrice] = useState(0),
    { scheme } = useColorScheme(),
    tabs = useTabs("1"),
    transferInput = useInput(""),
    [inputState, setInputState] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
    [loading, setLoading] = useState(false);

  useEffect(() => {
    loadArPrice();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (tabs.state === "2") window.open(`https://community.xyz/#${id}`);
    if (tabs.state === "3")
      window.open(`https://verto.exchange/token?id=${id}`);
  }, [tabs, id]);

  async function loadArPrice() {
    const verto = new Verto();
    setArPrice((await verto.latestPrice(id)) ?? 0);
  }

  async function transfer() {
    if (
      transferInput.state === "" ||
      Number(transferInput.state) <= 0 ||
      Number(transferInput.state) > balance
    )
      return setInputState("error");
    setLoading(true);
    // TODO: transfer
    setLoading(false);
  }

  return (
    <>
      <div className={styles.Head}>
        <div className={styles.Back} onClick={() => goTo(Home)}>
          <ArrowLeftIcon />
        </div>
        <h1>{name}</h1>
      </div>
      <div className={styles.PST}>
        <h1 className={styles.Balance}>
          {balance} <span>{ticker}</span>
        </h1>
        <h2 className={styles.BalanceInAR}>{balance * arPrice} AR</h2>
        <Tabs {...tabs.bindings} className={styles.Tabs}>
          <Tabs.Item
            label={
              <>
                <ArrowSwitchIcon />
                Transfer
              </>
            }
            value="1"
          >
            <div className={styles.Transfer}>
              <Spacer />
              <Input
                {...transferInput.bindings}
                placeholder="Transfer amount..."
                type="number"
                status={inputState}
                labelRight={ticker}
              />
              <Spacer />
              <Button
                style={{ width: "100%" }}
                onClick={transfer}
                loading={loading}
              >
                Transfer
              </Button>
            </div>
          </Tabs.Item>
          <Tabs.Item
            label={
              <>
                <img
                  src={communityxyz_logo}
                  alt="community-xyz"
                  className={styles.TabItemIcon}
                />
                CommunityXYZ
              </>
            }
            value="2"
          ></Tabs.Item>
          <Tabs.Item
            label={
              <>
                <img
                  src={scheme === "dark" ? verto_logo_dark : verto_logo_light}
                  alt="verto"
                  className={styles.TabItemIcon}
                />
                Verto
              </>
            }
            value="3"
          ></Tabs.Item>
        </Tabs>
      </div>
    </>
  );
}