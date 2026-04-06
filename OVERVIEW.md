# SENQ Project Overview

**_SENQ is a hyperlocal prediction market with privacy data x weighted bets.
Built on Avalanche. Powered by JPYC._**

---

## [MARKET & ISSUES] Why does Japan need prediction markets?

> _“Prediction markets are a new type of media that aggregate the wisdom of the crowd to accurately visualize the flow of public opinion.”_

With Japan's shrinking and aging population, we must optimize how we allocate limited resources and gain a clearer view of public opinion. Prediction markets are essential for building the infrastructure to make this possible.

However, themes related to Japan are rarely featured on Polymarket or Kalshi. Even when they are covered, the prediction accuracy is low and information is reflected with a delay.

For example, the 2025 Liberal Democratic Party leadership election became a popular topic on Polymarket, but many users misunderstood the Japanese political system. This is because prediction markets have not been legalized in Japan, and Japanese residents cannot participate in them.

---

## [PROBLEM] Barriers to making prediction markets work in Japan

There are several hurdles to making prediction markets a reality in Japan.

1. **Regulation:**
   We need to offer a prediction market that complies with Japanese laws and regulations.
2. **Low liquidity and the "thin market" problem:**
   In large markets like Polymarket, even if someone tries to manipulate information, a large number of arbitrageurs quickly correct any distortions. But in a local market like Japan's, where participants and liquidity are both scarce, there's a real risk that conventional prediction market mechanisms won't deliver sufficient accuracy.
3. **Opportunity cost problem:**
   A structural flaw in prediction markets is the opportunity cost created by locking up capital. Bet funds are locked until the market resolves, meaning users give up the yield they could have earned in the meantime (APY of 5-10% for dollar stablecoins). If the return from a prediction falls below that opportunity cost, rational users simply won't participate.

---

## [SOLUTION] SENQ’s Features

SENQ was designed by working backwards from these challenges.

1.  **Japan-native (Japan themes, Japanese participants, JPY stablecoin):**
    We focus exclusively on Japan-themed topics to create a prediction market that Japanese users can use with confidence. By using JPYC (a Japanese yen stablecoin) for bets, Japanese users can participate intuitively.
    <aside>
    💡

        The fact that we indirectly contribute to stabilizing Japanese government bonds through JPYC is also a positive talking point with regulators (because as JPYC issuance grows, more Japanese government bonds are purchased).

        </aside>

2.  **Privacy data x weighted bets:**
    In conventional prediction markets like Polymarket, all users are treated equally except for the size of their bet.
    SENQ, on the other hand, weights bets based on user attributes.
    This allows us to maintain prediction accuracy even in "thin markets" with few participants, and also makes it possible to run prediction markets on "hyperlocal topics" like local elections or regional transportation.
3.  **Yield integration:**
    We implement yield integration on bet funds.
    By eliminating the opportunity cost problem, topics that previously couldn't sustain a prediction market become viable.
    This can be achieved through yield-bearing stablecoins or by integrating DeFi with bet funds.
    <aside>
    💡

        We're also exploring a new business model where we use the yield from yield integration as protocol revenue, allowing us to set bet fees to 0%.

        </aside>

4.  **Regulation-adaptive architecture:**
    To stay compliant with regulations, we're taking a phased architecture approach using Avalanche.

To start, a "points scheme" can be offered legally even under current regulations.
However, points schemes make it difficult to attract users or achieve meaningful transaction volume, so we plan to eventually migrate to DApps (on-chain applications) using stablecoins.

After establishing ourselves at the application layer, we'll migrate to an Appchain (a dedicated, independent blockchain).
With an Appchain, we can customize user authentication, wallets, and transaction mechanics at the protocol level, making it easier to handle regulatory compliance and optimize the UX. 5. **Lobbying and public communication:**
While adapting to current regulations, it's also necessary to work toward improving those regulations.
We're actively communicating publicly and lobbying toward that goal. I'm mainly working with local governments and large companies to push forward use cases with real social value.

    <aside>
    💡

    A friend of mine is also leading the establishment of an industry association for prediction markets, and I'm supporting that effort. While strictly in a private and unofficial capacity, we're receiving encouragement from members of the Liberal Democratic Party as well.

    </aside>

---

## [TECH STACK] Architecture Overview

| Blockchain | Avalanche Fuji Testnet → Avalanche C-Chain → Avalanche L1.
We'll migrate in phases as we work toward regulatory compliance. |
| --- | --- |
| Stablecoin | JPYC on Avalanche for bets.
We also plan to integrate a Swap UI in the future so users can easily get JPYC from USDT. |
| Privacy Data | We use My Number cards (Japan's digital ID), LinkedIn, GitHub, and similar sources to obtain user attributes.
Privacy data is managed with anonymity preserved using tools like Midnight.
After migrating to an Appchain via Avalanche L1, we'll move to optimal data management through protocol-level customization. |
| AMM Model | Transition strategy based on liquidity scale: Parimutuel → LMSR AMM → Orderbook.
For the hackathon, we implemented weighted bets using Parimutuel. |
| Yield Integration | We think the simplest approach is adopting a yield-bearing stablecoin.
After migrating to an Appchain, native yield will also be achievable by issuing stablecoins natively (cf. USDB on Blast). |
| Chainlink | Trustless oracle design.
(Manual operation for the hackathon) |

### Midnight Integration (Privacy Data x zk Utilization)

SENQ utilizes user attribute information (occupation, location, expertise, etc.) to achieve "weighted bets" that enhance prediction accuracy. In doing so, strict privacy protection is essential when handling personal information.

This product utilizes Midnight, a privacy-focused infrastructure, to manage and process user data while maintaining anonymity. Specifically, user attribute information is kept confidential off-chain or on Midnight, and only the proof of whether necessary conditions are met is extracted as a zero-knowledge proof (zk technology).

By using these zk proofs, we achieve the following:

- Weighting of bets according to user attributes without disclosing personal information.
- Visualization of bet distribution based on specific attributes (e.g., residents of specific regions, professionals, etc.).
- Highly reliable data utilization while suppressing fraud and Sybil attacks.

This allows us to balance complete anonymity with regulatory compliance without compromising the value of information regarding "who is betting and with what background."

Furthermore, by combining applications on Avalanche with Midnight, we build a hybrid architecture that balances privacy and scalability. In the future, we plan to advance zk integration and data management optimization at the protocol level through Appchain implementation.

---

## [REVENUE] Business Model: B2B + Protocol Revenue

| B2B Revenue      | Revenue from PoC development of prediction markets, and revenue sharing from the joint operation of thematic prediction markets. |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Protocol Revenue | Bet fees, Yield Integration fees, and swap fees from USDT to JPYC. On-chain fees.                                                |
| API Subscription | Providing predictive data via API for advertising, marketing firms, financial institutions, and more.                            |

---

## [ROADMAP]

Action plan for business launch

| Initiative         | Description                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Hackathon & Grant  | MVP prototyping. Securing track record and non-equity funding for activities.                                                             |
| PoCs with partners | Collaborate with major Japanese corporations and local governments to conduct PoCs for prediction markets and secure development budgets. |
| Incorporation      | Registering a company in Japan or overseas. Raising funds in angel and pre-seed rounds.                                                   |
| Seed Round         | Raising funds in a seed round. While we will include some VCs, the focus will be on CVCs.                                                 |

---

## [TEAM] Top Web3 Experts in Japan

### Kyohei Ito / Founder

[Linkedin](https://www.linkedin.com/in/kyoheinft/) | [X(Twitter)](https://x.com/kyohei_nft)

Led Web3 companies as CTO and Japan Head. Currently focused on Prediction Markets x Privacy Data.

- [TomieByJunjiIto NFT](https://prtimes.jp/main/html/rd/p/000000056.000029349.html): 140 ETH sold out in 2 min. Netflix/Yomiuri TV partnership
- [Sony Bank stablecoin Appchain PoC](https://sonybank.jp/corporate/disclosure/press/2025/0626-01.html): proposal/closing/requirements definition
- [Sui x ONE Championship Tokyo Builder’s Arena](https://www.onefc.com/jp/news/%E6%9D%B1%E4%BA%AC%E3%83%93%E3%83%AB%E3%83%80%E3%83%BC%E3%82%BA%E3%83%BB%E3%82%A2%E3%83%AA%E3%83%BC%E3%83%8A%EF%BC%9Asui%E3%81%8C%E6%97%A5%E6%9C%AC%E3%81%AE%E3%82%A4%E3%83%8E%E3%83%99%E3%83%BC/): Won [2nd place + ONE's Favorite Prize](https://www.linkedin.com/posts/nikhilbirla_if-november-had-a-soundtrack-it-would-be-ugcPost-7407298919749124096-lyRN?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEGYBi8B3iGQmLRLuNQG-MbHsC5WsSP_cgw)

### Shota Takahashi / Fractional CTO

[Linkedin](https://www.linkedin.com/in/shota-takahashi-451796215/) | [X(Twitter)](https://x.com/hitsuji_haneta_)

Tohoku Univ. Master's → NTT Data → co-founded Bunzz, left CTO role end-2025.

- M&A EXIT: [CloudCerts $1M to CyberLinks](https://macloud.jp/news/114) (still running TOEIC blockchain certificates)
- Bunzz co-founder: [Raised $4.5M](https://prtimes.jp/main/html/rd/p/000000001.000113035.html) (Asia's largest Web3 dev infra)
- Hackathon wins ([B Dash Crypto 2022 1st place](https://www.neweconomy.jp/posts/267776), METI blockchain 2019)

---

## [ASK]

**Support We're Looking For / Why We Joined Build Games**

1. **Hackathon track record:**
   Running a prediction market on-chain in Japan is still difficult.
   But without any prediction market credentials, we have no way to prove we actually have the capability to build one. That's what drew us to global hackathons. Building on a testnet for a hackathon lets us develop a real MVP without worrying about regulations. Avalanche in particular is a blockchain that Japanese enterprises take seriously, so a strong showing at an Avalanche hackathon is an effective way to build credibility. (In fact, mentioning our Build Games finalist selection has already led to inbound from several Japanese companies.)
2. **Non-equity funding (grants):**
   We plan to incorporate later this year, in October at the earliest, and can't raise investment until then. So right now, non-equity funding is what we need. Personally, I stopped client work back in July of last year and have been drawing down my savings to focus on prediction market research, R&D, and business development, so things are getting tight.
3. **R&D sponsorship:**
   There are still technical questions we want to research, and we'd like to put together an R&D team to tackle them. We've already lined up several strong researchers, and the main thing we need now is the budget to bring them on. We're applying to Japanese government and academic support programs, but getting accepted in the Web3 space will likely be an uphill battle. We're looking for companies or individuals willing to sponsor our research and development work.
4. **PoC partners and introductions:**
   Rather than launching a prediction market platform outright, we want to build up our development budget by running individual PoC (proof of concept) projects with corporate partners first. We've recently made progress toward getting a few partners on board, but it's been a real struggle. We still need more, so introductions would be hugely appreciated.
5. **Fundraising support:**
   We're not looking to raise right away, but we'd like to start building relationships with investors now so they have enough context when the time comes.
