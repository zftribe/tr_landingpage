// Sets B and C for each assessment question (same meaning and option order as set A in assessment-model.ts).
// Written 10 Nov 2026 so a retake shows fresh wording; scoring is identical across sets.
export const VARIANTS: Record<string, { q: string; sub?: string; opts: string[] }[]> = {
 "F1": [
  {
   "q": "A coin in your portfolio falls 15% overnight with no headline.",
   "sub": "Where do you look first?",
   "opts": [
    "Its price chart",
    "The project's or company's reports"
   ]
  },
  {
   "q": "One of your holdings slides 15% in a week, and nobody knows why.",
   "sub": "What is the first thing you check?",
   "opts": [
    "How the price has been moving",
    "The latest financial results"
   ]
  }
 ],
 "F2": [
  {
   "q": "Picture a typical week of market work. Which fits you?",
   "opts": [
    "Brief sessions with lots of decisions",
    "Long, careful reading and a few decisions"
   ]
  },
  {
   "q": "How would you prefer to spend your market time each week?",
   "opts": [
    "Many quick calls in short bursts",
    "Deep study that leads to rare choices"
   ]
  }
 ],
 "F3": [
  {
   "q": "Which kind of holding appeals to you more?",
   "opts": [
    "A position I plan to close",
    "Part-ownership of a company for years"
   ]
  },
  {
   "q": "When you put money in, what do you want to be holding?",
   "opts": [
    "A trade with a planned exit",
    "A share of a business I keep long term"
   ]
  }
 ],
 "F4": [
  {
   "q": "It is Saturday and the markets are shut.",
   "sub": "Which hour would you enjoy most?",
   "opts": [
    "Going back over my recent trades",
    "Studying a company or a fund"
   ]
  },
  {
   "q": "The exchanges are closed for the weekend.",
   "sub": "How would you like to spend an hour?",
   "opts": [
    "Reviewing how my trades played out",
    "Learning about businesses or funds"
   ]
  }
 ],
 "F5": [
  {
   "q": "Which news line would you click first?",
   "opts": [
    "\"Price hits a new 52-week high\"",
    "\"Company reports twice last year's profit\""
   ]
  },
  {
   "q": "Two headlines appear. Which one makes you read on?",
   "opts": [
    "\"Shares break above their yearly peak\"",
    "\"Earnings double from a year ago\""
   ]
  }
 ],
 "F6": [
  {
   "q": "How would you describe a successful year?",
   "opts": [
    "Lots of trades, each one done well",
    "A portfolio that grew steadily, without fuss"
   ]
  },
  {
   "q": "At the end of a good year, what would you point to?",
   "opts": [
    "A high number of well-run trades",
    "Holdings that quietly gained in value"
   ]
  }
 ],
 "F7": [
  {
   "q": "How often would you look at your holdings?",
   "opts": [
    "Many times during the day",
    "Once a month is enough"
   ]
  },
  {
   "q": "How frequently do you expect to check your positions?",
   "opts": [
    "A number of times every day",
    "Monthly, at most"
   ]
  }
 ],
 "F8": [
  {
   "q": "You will have no access to the markets for two weeks.",
   "opts": [
    "I would find that hard",
    "No problem: little changes in two weeks"
   ]
  },
  {
   "q": "A two-week break means you cannot check prices at all.",
   "opts": [
    "That would make me uneasy",
    "That is fine; things move slowly enough"
   ]
  }
 ],
 "T1": [
  {
   "q": "If a trade is working, how long would you stay in it?",
   "opts": [
    "A matter of minutes",
    "Hours, but closed before the day ends",
    "Several days up to a few weeks",
    "Several months"
   ]
  },
  {
   "q": "What is your ideal holding time for a winning trade?",
   "opts": [
    "Only minutes",
    "Same day, out by the close",
    "Days to a few weeks",
    "Months at a time"
   ]
  }
 ],
 "T2": [
  {
   "q": "Which chart timeframe would you leave on your screen?",
   "opts": [
    "One-minute candles",
    "Five- to fifteen-minute candles",
    "Hourly up to daily candles",
    "Weekly candles"
   ]
  },
  {
   "q": "Which candle size would you watch most of the time?",
   "opts": [
    "1 minute per candle",
    "5 to 15 minutes per candle",
    "1 hour to 1 day per candle",
    "1 week per candle"
   ]
  }
 ],
 "T3": [
  {
   "q": "Price breaks out and volume surges.",
   "opts": [
    "Enter right away with the move",
    "Wait for price to pull back first"
   ]
  },
  {
   "q": "A level gives way on heavy volume.",
   "opts": [
    "Get in while it is moving",
    "Hold off until it dips back"
   ]
  }
 ],
 "T4": [
  {
   "q": "What kind of price move would you rather trade?",
   "opts": [
    "Stay with a trend until it finishes",
    "Swings back and forth between two levels"
   ]
  },
  {
   "q": "Which pattern would you aim to profit from?",
   "opts": [
    "A trend, followed to its end",
    "Bounces inside a range"
   ]
  }
 ],
 "T5": [
  {
   "q": "Which approach appeals to you more?",
   "opts": [
    "Small gains, repeated many times daily",
    "A larger move, taken less frequently"
   ]
  },
  {
   "q": "Which would you rather aim for?",
   "opts": [
    "Many small wins in a single day",
    "Fewer trades, each a bigger move"
   ]
  }
 ],
 "T6": [
  {
   "q": "What usually makes you close a position?",
   "opts": [
    "A rule I decided on beforehand",
    "The reason I entered is no longer true"
   ]
  },
  {
   "q": "How do you know it is time to exit?",
   "opts": [
    "My pre-set rule is triggered",
    "My original case for the trade breaks"
   ]
  }
 ],
 "T7": [
  {
   "q": "In a rising market, price dips 5%.",
   "opts": [
    "Stay in: trends pause and resume",
    "Sell near resistance, buy near support"
   ]
  },
  {
   "q": "An uptrend gives back 5%.",
   "opts": [
    "Keep holding: dips are normal in trends",
    "Trade the range: sell high, buy low"
   ]
  }
 ],
 "T8": [
  {
   "q": "A strong move started without you.",
   "opts": [
    "Enter if the momentum continues",
    "Skip it and wait for the next setup"
   ]
  },
  {
   "q": "You were not in when a big rally began.",
   "opts": [
    "Get in while momentum stays strong",
    "Pass, and look for a fresh setup"
   ]
  }
 ],
 "T9": [
  {
   "q": "What does your written trading plan usually include?",
   "opts": [
    "The precise entry, stop and size",
    "The overall view and the reasoning"
   ]
  },
  {
   "q": "If you write a plan before acting, what goes in it?",
   "opts": [
    "Exact numbers: entry, stop, position size",
    "The broad picture and my reasons"
   ]
  }
 ],
 "T10": [
  {
   "q": "The closing bell is near.",
   "sub": "What happens to your open trades?",
   "opts": [
    "Everything is closed. I never hold overnight.",
    "Some stay open if my plan allows"
   ]
  },
  {
   "q": "The trading day is about to end.",
   "sub": "What is the state of your positions?",
   "opts": [
    "All flat. No overnight positions.",
    "Kept open where the plan calls for it"
   ]
  }
 ],
 "T11": [
  {
   "q": "Which day would you count as a good one?",
   "opts": [
    "Twenty small trades, ending in profit",
    "A single trade that followed the plan"
   ]
  },
  {
   "q": "Describe a trading day you would be happy with.",
   "opts": [
    "Many small trades, net positive",
    "One trade, executed exactly as planned"
   ]
  }
 ],
 "T12": [
  {
   "q": "A major announcement hits a stock on your watchlist.",
   "opts": [
    "Trade the reaction within the hour",
    "Let things calm down first"
   ]
  },
  {
   "q": "Breaking news moves a share you follow.",
   "opts": [
    "Act on the move in the first hour",
    "Wait until the reaction settles"
   ]
  }
 ],
 "T13": [
  {
   "q": "Which information would you follow most carefully?",
   "opts": [
    "Live order flow, moment to moment",
    "The day's high, low and opening range",
    "Patterns on the daily chart",
    "Long-term moving averages"
   ]
  },
  {
   "q": "What would get most of your attention?",
   "opts": [
    "Each order as it hits the market",
    "Today's range: open, high and low",
    "Daily chart formations",
    "Moving averages across many months"
   ]
  }
 ],
 "T14": [
  {
   "q": "Which way of managing positions fits you?",
   "opts": [
    "Hold a handful for about three months",
    "Add or reduce as the trend dictates"
   ]
  },
  {
   "q": "How would you rather run your positions?",
   "opts": [
    "A few holdings kept for a full quarter",
    "Scale in or out following the trend"
   ]
  }
 ],
 "T15": [
  {
   "q": "A share is up 9% today and still looks strong.",
   "opts": [
    "Close the trade before the market shuts",
    "Keep it for two or three days"
   ]
  },
  {
   "q": "Your position gains 9% in one session and looks firm.",
   "opts": [
    "Exit before today's close",
    "Hold on for another two to three days"
   ]
  }
 ],
 "T16": [
  {
   "q": "How long do you usually stay in a trade?",
   "opts": [
    "From seconds to a few minutes",
    "From minutes to a few hours"
   ]
  },
  {
   "q": "What is your typical time in a position?",
   "opts": [
    "A few seconds up to several minutes",
    "Several minutes up to a few hours"
   ]
  }
 ],
 "T17": [
  {
   "q": "How would you want to prepare a strategy before using it?",
   "opts": [
    "Test it on years of historical data",
    "Learn it through observation and practice"
   ]
  },
  {
   "q": "Before trusting a strategy, what would you do?",
   "opts": [
    "Check it against years of past prices",
    "Pick it up by watching and trying"
   ]
  }
 ],
 "T18": [
  {
   "q": "One industry is suddenly in the headlines daily.",
   "opts": [
    "Find the strongest-looking chart in it",
    "Ask whether the change will last"
   ]
  },
  {
   "q": "A sector has become the talk of the news every day.",
   "opts": [
    "Search for its best chart setup",
    "Judge whether it is a long-term shift"
   ]
  }
 ],
 "T19": [
  {
   "q": "How much do fees and trading costs matter to you?",
   "opts": [
    "A great deal: I trade frequently",
    "Very little: I seldom trade"
   ]
  },
  {
   "q": "How important are commissions and costs in your plan?",
   "opts": [
    "Very: I place many trades",
    "Not much: I place few trades"
   ]
  }
 ],
 "T20": [
  {
   "q": "A position has been flat for six weeks.",
   "opts": [
    "That is fine if my reason still stands",
    "Close it: the expected trend did not come"
   ]
  },
  {
   "q": "Six weeks pass and your trade has not moved.",
   "opts": [
    "I keep it while my thesis is intact",
    "I exit, since the trend never started"
   ]
  }
 ],
 "I1": [
  {
   "q": "What makes an investment attractive to you?",
   "opts": [
    "A quality business priced below its worth",
    "Reliable payouts each quarter",
    "A company expanding very quickly",
    "Owning the entire market at low cost"
   ]
  },
  {
   "q": "Which investment would catch your interest first?",
   "opts": [
    "A sound company on sale",
    "Regular quarterly income",
    "A fast-growing business",
    "A low-cost fund of the whole market"
   ]
  }
 ],
 "I2": [
  {
   "q": "Which reading would you choose for an evening?",
   "opts": [
    "Annual reports and valuation work",
    "Records of past dividend payments",
    "New products and growth figures",
    "Whitepapers and token supply details"
   ]
  },
  {
   "q": "What kind of material do you enjoy studying?",
   "opts": [
    "Company annual reports and valuations",
    "A company's history of dividends",
    "Launch news and growth statistics",
    "Project whitepapers and token supply"
   ]
  }
 ],
 "I3": [
  {
   "q": "Which would you rather look into this evening?",
   "opts": [
    "A young project with many unknowns",
    "An established business with clear figures"
   ]
  },
  {
   "q": "You have one evening to research. Which do you pick?",
   "opts": [
    "An early-stage idea, highly uncertain",
    "A tested company with a known track record"
   ]
  }
 ],
 "I4": [
  {
   "q": "How much time would you give to selecting investments?",
   "opts": [
    "Very little: a broad fund each month",
    "A moderate amount: a few companies I track",
    "Plenty: thorough research"
   ]
  },
  {
   "q": "How involved would you be in choosing what to buy?",
   "opts": [
    "Barely: monthly buys of a wide fund",
    "Somewhat: I follow a handful of companies",
    "Very: detailed, in-depth study"
   ]
  }
 ],
 "I5": [
  {
   "q": "An investment might be worth nothing, or ten times more.",
   "opts": [
    "Worth a look, with a small amount",
    "Not something I would do"
   ]
  },
  {
   "q": "This holding could lose everything or multiply tenfold.",
   "opts": [
    "Appealing, if the stake is small",
    "Not for my money"
   ]
  }
 ],
 "I6": [
  {
   "q": "A company in your portfolio reduces its dividend.",
   "opts": [
    "See whether it is still undervalued",
    "See whether the income remains secure"
   ]
  },
  {
   "q": "One of your holdings announces a lower dividend.",
   "opts": [
    "Ask if the price is still a bargain",
    "Ask if the payout is still dependable"
   ]
  }
 ],
 "I7": [
  {
   "q": "A share you hold has risen 100% in twelve months.",
   "opts": [
    "Sell: it is not cheap any more",
    "Keep it: the growth has further to go"
   ]
  },
  {
   "q": "Your investment has doubled over the past year.",
   "opts": [
    "Sell, since the bargain is gone",
    "Hold, since it is still growing"
   ]
  }
 ],
 "I8": [
  {
   "q": "Do you aim to beat the market or keep pace with it?",
   "opts": [
    "Keeping pace cheaply is enough",
    "I want to choose the winners"
   ]
  },
  {
   "q": "Which goal fits you: outperforming or tracking the market?",
   "opts": [
    "Tracking it at a low cost suits me",
    "I aim to find the best performers"
   ]
  }
 ],
 "I9": [
  {
   "q": "A company makes no profit yet, but sales rise 40% yearly.",
   "opts": [
    "Appealing: growth comes first",
    "No: I want to see profits"
   ]
  },
  {
   "q": "Sales grow 40% each year, but there are no profits so far.",
   "opts": [
    "Worth a look: growth matters most",
    "I pass until it earns a profit"
   ]
  }
 ],
 "I10": [
  {
   "q": "The overall market drops 25%.",
   "opts": [
    "Continue my regular monthly purchase",
    "Look for bargains",
    "Confirm the growth cases are intact",
    "Sit tight and wait"
   ]
  },
  {
   "q": "Prices across the market fall by a quarter.",
   "opts": [
    "Keep buying each month as usual",
    "Search for undervalued shares",
    "Recheck that growth stories still work",
    "Do nothing and wait for recovery"
   ]
  }
 ],
 "I11": [
  {
   "q": "What would you do with dividends and interest?",
   "opts": [
    "Put all of it back in",
    "Eventually live on part of it"
   ]
  },
  {
   "q": "Where does the income from your investments go?",
   "opts": [
    "Fully reinvested",
    "Some day, part of my living costs"
   ]
  }
 ],
 "I12": [
  {
   "q": "Which new area would you rather explore?",
   "opts": [
    "Digital tokens and new networks",
    "Technology companies on the exchange"
   ]
  },
  {
   "q": "Which frontier draws more of your attention?",
   "opts": [
    "Tokens and emerging blockchain networks",
    "Publicly traded technology firms"
   ]
  }
 ],
 "I13": [
  {
   "q": "A worrying economic headline appears.",
   "opts": [
    "Set it aside: I invest for decades",
    "Keep reading: it may bring a bargain"
   ]
  },
  {
   "q": "The news warns about the economy.",
   "opts": [
    "Not relevant: my horizon is decades",
    "Worth following: it could open a bargain"
   ]
  }
 ],
 "I14": [
  {
   "q": "Which type of company would you rather own?",
   "opts": [
    "Established firms that pay out yearly",
    "Young firms that could become very big"
   ]
  },
  {
   "q": "Which holdings suit you better?",
   "opts": [
    "Mature businesses with annual payouts",
    "Early-stage businesses with large potential"
   ]
  }
 ],
 "I15": [
  {
   "q": "What share of your investing would go to long shots?",
   "opts": [
    "Nothing",
    "A small portion",
    "A large portion"
   ]
  },
  {
   "q": "How much would you put into high-risk, high-reward bets?",
   "opts": [
    "Zero",
    "A little",
    "A lot"
   ]
  }
 ],
 "I16": [
  {
   "q": "Which figure would you look at first?",
   "opts": [
    "The price-to-earnings ratio",
    "How fast sales are growing",
    "Dividend yield and how well it is covered",
    "The fund's annual cost"
   ]
  },
  {
   "q": "When you review an investment, which number comes first?",
   "opts": [
    "Price relative to earnings",
    "Revenue growth",
    "Yield and dividend cover",
    "The yearly fund expense"
   ]
  }
 ],
 "L1": [
  {
   "q": "On a weekday, how much free time do you have while markets are open?",
   "opts": [
    "Less than an hour",
    "Between one and three hours",
    "The majority of the day",
    "None: only evenings and weekends"
   ]
  },
  {
   "q": "During weekday market hours, how much time can you spare?",
   "opts": [
    "Under 60 minutes",
    "One to three hours",
    "Most of the trading day",
    "Just evenings and weekends"
   ]
  }
 ],
 "L2": [
  {
   "q": "How long could you leave this money untouched?",
   "opts": [
    "Less than a year",
    "Between one and three years",
    "Five years or longer"
   ]
  },
  {
   "q": "For how long will you not need this money?",
   "opts": [
    "Under one year",
    "One to three years",
    "At least five years"
   ]
  }
 ],
 "L3": [
  {
   "q": "Suppose this money were lost completely.",
   "opts": [
    "I would struggle to pay my bills",
    "I would be fine"
   ]
  },
  {
   "q": "If all of this money disappeared, what would happen?",
   "opts": [
    "My bills would be affected",
    "My finances would be fine"
   ]
  }
 ],
 "L4": [
  {
   "q": "Do you have an emergency fund set aside?",
   "sub": "Roughly three months of expenses",
   "opts": [
    "Yes",
    "Partly",
    "Not yet"
   ]
  },
  {
   "q": "Is there money saved for unexpected costs?",
   "sub": "Around three months of living expenses",
   "opts": [
    "Yes, fully",
    "Some of it",
    "Not yet"
   ]
  }
 ],
 "L5": [
  {
   "q": "Will you need this money to provide income soon?",
   "opts": [
    "Yes, to pay regular bills",
    "No, it can be left to grow"
   ]
  },
  {
   "q": "Do you need this money to pay you an income in the near term?",
   "opts": [
    "Yes, for my regular bills",
    "No, it is free to grow"
   ]
  }
 ],
 "L6": [
  {
   "q": "About how much would you begin with?",
   "sub": "Small amounts are fine. This only guides the suggestions.",
   "opts": [
    "Less than US$500",
    "Between US$500 and 5,000",
    "Over US$5,000"
   ]
  },
  {
   "q": "What starting amount do you have in mind?",
   "sub": "Any amount is fine. It only tailors what we show you.",
   "opts": [
    "Below US$500",
    "From US$500 to 5,000",
    "Above US$5,000"
   ]
  }
 ],
 "E1": [
  {
   "q": "How much experience do you have trading or investing?",
   "opts": [
    "None so far",
    "Less than a year",
    "Between one and three years",
    "Over three years"
   ]
  },
  {
   "q": "For how long have you been in the markets?",
   "opts": [
    "I have not started yet",
    "Under twelve months",
    "One to three years",
    "Longer than three years"
   ]
  }
 ],
 "E2": [
  {
   "q": "Which of these have you used yourself?",
   "sub": "Choose the most advanced one",
   "opts": [
    "Only buying and holding",
    "Limit orders and stop orders",
    "Leverage or futures contracts"
   ]
  },
  {
   "q": "What is the most advanced tool you have used?",
   "sub": "Select the highest that applies",
   "opts": [
    "Simple buy and hold",
    "Limit and stop orders",
    "Leveraged trades or futures"
   ]
  }
 ],
 "E3": [
  {
   "q": "Which best describes a stop-loss?",
   "sub": "A short check, not an exam",
   "opts": [
    "An order to sell if price drops to your chosen level",
    "A promise that you cannot lose any more",
    "I am not sure"
   ]
  },
  {
   "q": "What does a stop-loss order do?",
   "sub": "Just a quick check",
   "opts": [
    "Sells when price falls to a level you set",
    "Guarantees your loss stops there",
    "Not sure"
   ]
  }
 ],
 "X1": [
  {
   "q": "Before deciding, what do you mainly rely on?",
   "opts": [
    "The price chart",
    "The company's financial figures",
    "The narrative and the people involved",
    "My own tested rules"
   ]
  },
  {
   "q": "What weighs most when you make a decision?",
   "opts": [
    "What the chart shows",
    "The business's numbers",
    "The story and its leaders",
    "Rules I have already tested"
   ]
  }
 ],
 "X2": [
  {
   "q": "Which view do you hold more strongly?",
   "opts": [
    "Price already reflects everything",
    "Over time, price follows the business"
   ]
  },
  {
   "q": "Which statement is closer to your belief?",
   "opts": [
    "All I need is in the price",
    "The business drives the price"
   ]
  }
 ],
 "X3": [
  {
   "q": "Which advantage describes you better?",
   "opts": [
    "Seeing a major trend before others",
    "Rules tested on historical data"
   ]
  },
  {
   "q": "Where would your edge most likely come from?",
   "opts": [
    "Catching a big theme early",
    "Rules proven on past markets"
   ]
  }
 ],
 "X4": [
  {
   "q": "Your indicators point in opposite directions.",
   "opts": [
    "Stick to my set rule",
    "Rely on my own judgement"
   ]
  },
  {
   "q": "Two signals you use give conflicting answers.",
   "opts": [
    "Apply the rule I decided on",
    "Make a judgement call"
   ]
  }
 ],
 "X5": [
  {
   "q": "How do you feel about a checklist before each order?",
   "opts": [
    "I would welcome it",
    "It would feel too restrictive"
   ]
  },
  {
   "q": "Going through a checklist before every trade sounds...",
   "opts": [
    "Helpful, I would use it",
    "Confining, I would rather not"
   ]
  }
 ],
 "R1": [
  {
   "q": "Your target was 15%, and you are up 22% after three weeks.",
   "opts": [
    "Close it and take the profit, per plan",
    "Sell half and let the rest run",
    "Keep the whole position running"
   ]
  },
  {
   "q": "Three weeks in, a trade aimed at 15% is showing 22%.",
   "opts": [
    "Bank the gain as planned",
    "Lock in half, keep half open",
    "Leave all of it in"
   ]
  }
 ],
 "R2": [
  {
   "q": "What share of your account would you risk on a single idea?",
   "opts": [
    "Around 1%",
    "Between 2% and 5%",
    "10% or more"
   ]
  },
  {
   "q": "How much of your capital would you put at risk on one position?",
   "opts": [
    "Roughly 1%",
    "2% to 5%",
    "At least 10%"
   ]
  }
 ],
 "R3": [
  {
   "q": "A position is 8% down and your plan says to exit.",
   "opts": [
    "Exit, as the plan says",
    "Hold on for a rebound",
    "Add more at the lower price"
   ]
  },
  {
   "q": "You are 8% in the red and your rule says sell.",
   "opts": [
    "Sell according to plan",
    "Wait for price to recover",
    "Buy more while it is cheaper"
   ]
  }
 ],
 "R4": [
  {
   "q": "Your holdings lose 20% in one month.",
   "opts": [
    "I would rest easy",
    "Uncomfortable, but I would hold",
    "I would sell to end the stress"
   ]
  },
  {
   "q": "In a single month, your portfolio is down 20%.",
   "opts": [
    "It would not trouble my sleep",
    "I would feel uneasy yet stay in",
    "I would sell to make it stop"
   ]
  }
 ],
 "P1": [
  {
   "q": "Study the chart, then make your call.",
   "sub": "Weeks of sideways price, then a breakout on heavy volume.",
   "opts": [
    "Enter at once",
    "Wait for price to retest the level",
    "Pass on it"
   ]
  },
  {
   "q": "Review the chart above and choose.",
   "sub": "A long flat stretch, then a high-volume breakout.",
   "opts": [
    "Buy now",
    "Wait for a retest first",
    "Stay out of it"
   ]
  }
 ],
 "P2": [
  {
   "q": "Study the chart, then make your call.",
   "sub": "A steep fall, followed by a rebound.",
   "opts": [
    "Buy the drop",
    "Wait until the trend reverses",
    "Do not get involved"
   ]
  },
  {
   "q": "Review the chart above and choose.",
   "sub": "Price falls sharply, then recovers a little.",
   "opts": [
    "Buy on the dip",
    "Wait for the trend to change",
    "Keep out"
   ]
  }
 ]
}
