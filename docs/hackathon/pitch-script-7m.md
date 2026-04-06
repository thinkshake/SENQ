## **Hook & Market Opportunity**

Gmgm、I'm Kyohei!!

What should we build with Web3 for World today?

Definitely, it's a prediction market.

2025 was the year of prediction markets.
On Polymarket and Kalshi alone, the total volume reached forty billion dollars.

So, what is a prediction market?

Prediction markets ia s aggregators of collective intelligence. And also a new form of media that visualizes trends in public opinion.

Users vote on the future of a theme with their own money.
This simple mechanism has been shown to be even more accurate in its predictions than traditional media or the experts.

With Japan’s rapidly aging society and declining birthrate, it has become essential to find ways to allocate limited social resources effectively and grasp what the public really thinks. Prediction markets could provide the very foundation needed to achieve this.

## **Problem**

However, there are clear barriers to bringing prediction markets to Japan.

First, Japanese topics are rarely listed on Polymarket or Kalshi.
Even when they are listed, accuracy is often low, and information is slow to update.
This is because people living in Japan cannot easily participate.

For example, last year, the election of a new leader of Japan’s ruling party was a popular market on Polymarket.
But many users misunderstood how Japan’s political system works.

So why can’t Japanese users join these markets?

Because, regulation.
In Japan, prediction markets are not yet allowed.

And even if we solve the legal issue, there is another problem: the thin market problem.

In a local market like Japan, the number of participants and the level of liquidity are both low.

In large markets like Polymarket, even if someone tries to manipulate prices, many arbitrage traders step in and correct the distortion.

But in a small market with few participants, this mechanism does not work well.

## **Solution**

We designed SENQ by working backwards from these challenges. Let me walk you through our key features.

**Weighted Betting**

Our biggest core technology is Weighted Betting. In traditional prediction markets, every user is treated the same. The only difference is how much money you bet. SENQ is different. We weight bets based on user attributes. Even with low liquidity, if the right people are in the market, we can keep prediction accuracy high.

**Anonymous Use of Privacy Data**

Next, anonymous use of privacy data. Users just connect their My Number Card or social accounts like GitHub, X, or LinkedIn. My Number Card is a digital ID that every Japanese person has. We use privacy layers like Midnight to prove your attributes without showing personal information. And we can also show bet trends by demographics. Not just simple odds, but who is predicting what. This makes SENQ a more valuable media platform.

**Custom AMM**

Our AMM model evolves step by step. We start with Parimutuel. As liquidity grows, we move to LSMR AMM, and then to an Orderbook model. All of them are custom-built with our weighting system inside.

**JPYC and USDT**

We use JPY stablecoins like JPYC for betting, so Japanese users can use it naturally in their own currency. Also, JPYC helps support Japanese Government Bonds indirectly, which gives us a strong point when talking to regulators. In the future, we will add a simple way to convert USDT to JPYC inside the app.

## **Product Demo**

Let me show you a product demo. Sorry the UI is in Japanese.

First, the admin side. Creating a market. You enter the topic, the date, and the choices, then send a transaction. Unlike Polymarket, which only does Yes or No, we support multiple choices. You can do binary if you want, or you can list each candidate one by one.

Next, the user side. Placing a bet on a market. The weighting is applied automatically, but everything else follows the standard prediction market UI, so it feels familiar and easy to use. In this demo we use ETH, but in production we will switch to JPYC.

## **Revenue Model**

Our main focus is B2B. We work with local governments and big companies to run prediction markets together on specific topics, and share the revenue. We also sell prediction data to banks and marketing firms through API.

In the short term, B2B revenue is our main income. In the mid to long term, we add protocol revenue like bet fees and yield integration.

## **Traction & Roadmap**

We already started talks with several local governments and companies.

For example, CAC, a major Japanese IT company, offered us CVC funding after a hackathon. Next week, we will propose a corporate prediction market PoC to them.

Digital Platformer, a Web3 company strong in local banking, also offered us a PoC after a same hackathon.

We also applied to a business contest by Shueisha, the publisher of ONE PIECE and NARUTO, with a manga prediction market idea.

Our plan is to use SENQ's core technology and run multiple PoCs in parallel. We expect to start at least one PoC very soon.

## **Team**

Let me introduce our team

My team member, Shota, is the former CTO of Bunzz, where he raised $4.5 million in Seed funding.

I also have served as CTO and Head of Japan at multiple companies.

My key achievements include leading a stablecoin-focused Appchain PoC for Sony Bank and an NFT with Netflix, brabrabrabra.

As for the Avalanche community, I supported their Japan event in 2022 as a venue sponsor. The Avalanche hoodie I'm wearing now was actually a gift from that event. I also keep in touch with the founding members of Ava Labs Japan.

## **Vision & Close**

The name "SENQ" comes from Senku, the hero of Dr. STONE. It also means "1,000 Questions."
Our ultimate goal is to make prediction markets the decision-making infrastructure of Japanese society. Election forecasts, policy testing, local issue mapping. We want prediction markets to become a public tool that people use every day.
And after we prove the model in Japan, we expand to Asia. South Korea, Southeast Asia, and other countries where local prediction markets do not exist yet. We launch optimized local markets one after another, all on Avalanche.
This is the vision of SENQ. Thank you.
