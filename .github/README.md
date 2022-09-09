# QRate

QRate is a fork of Arweave wallet - ArConnect. It adds new functionalities which let users vote with their QRT tokens wether any website contains fake informations or not. The aim of this plugin is to spotlight problem of fake news spreading on the Internet. It seems to be an increasing issue as the number of informations on the web grows. QRate wants to fight this problem and give the power of deciding for what is right and wrong back to the people. It uses decentralized tools - Arweave blockchain and Warp contracts - to make the process not possible to be manipulated by the big organizations.

## Rules

The process is simple. If you detect that a website possibly contains fake informations, you can report it as fake. The dispute has opened. Optionally - you can stake initial amount of tokens and set the timestamp. The default timestamp is set to one day from current moment. From this point on, if you visit the reported website, you will see an orange warning box in the right corner claiming that page might contain fake info. If you report a page as a fake, other wallet addresses can vote with their QRT tokens wether they agree with you or not. They can vote for **TRUE** - if they think that the news is real or **FAKE** - if they consider the news to be fake. When the dispute ends, the amount of tokens that addresses staked for the losing options are redistributed proportionally between winning address. If the website has been marked as fake, the orange box will turn red with the information that the website has been indicated as fake.

## Quadratic voting

It is very easy for _big whales_ to wield influence on the results of voting. That's why Qrate uses the concept of quadratic voting which tends to eliminate this problem. Voters can stake multiple tokens but each of the tokens cost more credits then the last one. It can help protect the interests of smaller participants which care deeply about particular issues. The algorithm is simple:

```sh
cost to the voter = (number of votes) ^ 2
```

Imagine the situation - you are a big player and you want to stake 4 QRT tokens to claim the the news is real, there are also three smaller players - each one of them wants to stake 1 QRT token for the news to be fake. Now after the quadratic voting calculation, tokens staked by the big player is equal to 2 and sum of the tokens staked by the smaller players is equal to 3. The dispute ends, the news is considered fake even if theoretically more tokens were staked for the losing option.

## Contract

The contract has been already deployed using [Arweave blockchain](https://arweave.org) and [Warp contracts SDK](https://github.com/warp-contracts/warp). You can view the contract within its contracts source, transactions and current state in [SonAr](https://sonar.warp.cc/#/app/contract/SaGNYkJaCiOjYYKBZUi8zvhS5R8gm_aFKWALKdGitYo).

## Install

Visit [Google Chrome Web Store](https://chrome.google.com/webstore/detail/q-rate/jeciickbndbjeappebgjkmhkbpmdieme) and add QRate to your extensions. You're ready to go!

## Run locally

1. Install the dependencies:

```sh
yarn install
```

or

```sh
npm install
```

2. Build package for chrome:

```sh
yarn build:chrome
```

or

```sh
npm build:chrome
```

3. Open `chrome://extensions`, click `Load unpacked` button and select `public` folder from QRate repository when asked. The extension should be added to your extensions panel.
