// The welcome page's Trader-or-investor assessment (George's picks, 10 Nov 2026): the book's Affinity Trial engine
// (app/affinity-trial-model.ts in trading-republic-course), ported with formal wording. No painted scenes, no "go deeper"
// round, plain style names; the book class is named once, as a bridge. Pure functions only. A learning style, never advice.
export type ClassId = 'shadow' | 'duelist' | 'vanguard' | 'ranger' | 'knight' | 'warden' | 'arcanist' | 'falconer' | 'druid' | 'cartographer' | 'scout';
export type TrialClassId = ClassId;
export type TrialClass = { id: TrialClassId; name: string; book: string; side: 'trader' | 'investor'; time: string; about: string; demand: string[] };
export type FacetId = 'lens' | 'decide' | 'risk' | 'stage';
export type Facet = { name: string; values: Record<string, string>; about: Record<string, string> };
export type Weights = Partial<Record<string, number>>;
// l = label, i = icon, w = class weights, why = the reason shown on the reveal, f = facet weights, flag = a caution.
export type Opt = { l: string; i: string; w: Weights; why: string; f: Weights; flag?: string };
export type Stage = 'fork' | 'style' | 'life' | 'exp' | 'facet' | 'replay' | 'deeper';
export type Card = { id: string; stage: Stage; scene: string; q: string; sub?: string; opts: Opt[]; sib?: string; branch?: 'trader' | 'investor'; facet?: FacetId; when?: (s: Ctx) => boolean };
export type Answer = { id: string; o: number };
export type TrialState = { answers: Answer[]; deeper: boolean };
type Ctx = { answered: (id: string, o?: number) => boolean; leader: () => TrialClassId; leaderSide: () => 'trader' | 'investor' };

export const TRIAL_CLASSES: readonly TrialClass[] = [
  { id: 'shadow', name: 'Scalping', book: 'Shadowblade', side: 'trader', time: 'seconds to minutes', about: 'Many very short trades a day, taking small moves with fast execution.', demand: ['Long, uninterrupted screen time during market hours', 'Fast execution and strict stops', 'Low costs: fees matter on every trade'] },
  { id: 'duelist', name: 'Day trading', book: 'Duelist', side: 'trader', time: 'within the day', about: 'Opening and closing trades within the same day, never holding overnight.', demand: ['Market hours free most days', 'Closing every position before the close', 'A daily loss limit you never break'] },
  { id: 'vanguard', name: 'Momentum trading', book: 'Vanward', side: 'trader', time: 'hours to days', about: 'Joining strong moves and breakouts while they have force behind them.', demand: ['Watching for breakouts during the day', 'Cutting a fading move quickly', 'Not chasing every spike'] },
  { id: 'ranger', name: 'Swing trading', book: 'Ranger', side: 'trader', time: 'days to weeks', about: 'Holding for days to weeks, trading between clear support and resistance.', demand: ['A daily check of your charts', 'Patience between support and resistance', 'A written exit for every trade'] },
  { id: 'knight', name: 'Trend following', book: 'Knight', side: 'trader', time: 'weeks to months', about: 'Riding established trends with objective rules, accepting small false starts.', demand: ['Objective rules you follow every time', 'Sitting through pullbacks', 'Accepting many small losses while waiting for a trend'] },
  { id: 'warden', name: 'Position trading', book: 'Warden', side: 'trader', time: 'months', about: 'A few positions held for months on a written thesis.', demand: ['Position sizes no single shock can break', 'A thesis you write down and review', 'Waiting is part of the work'] },
  { id: 'arcanist', name: 'Value investing', book: 'Arcanist', side: 'investor', time: 'years', about: 'Buying good businesses for less than they are worth, and waiting.', demand: ['Reading company reports', 'Patience while price ignores value', 'Knowing what would make you wrong'] },
  { id: 'falconer', name: 'Growth investing', book: 'Falconer', side: 'investor', time: 'years', about: 'Owning fast-growing businesses and holding through big swings.', demand: ['Following how fast a business really grows', 'Holding through big price swings', 'Knowing when the growth story has changed'] },
  { id: 'druid', name: 'Dividend investing', book: 'Druid', side: 'investor', time: 'years', about: 'Owning businesses that pay a steady share of their profits.', demand: ['Checking the cash behind each payout', 'A long horizon', 'Treating income as uncertain'] },
  { id: 'cartographer', name: 'Index investing', book: 'Cartographer', side: 'investor', time: 'decades', about: 'Owning the whole market through low-cost funds, bought regularly.', demand: ['Regular buying, whatever the headlines', 'Low costs and broad funds', 'Leaving it alone for years'] },
  { id: 'scout', name: 'Speculative investing', book: 'Scout', side: 'investor', time: 'varies', about: 'Small stakes in early projects such as new tokens and networks, with big unknowns.', demand: ['Money you can afford to lose entirely', 'Research on supply, holders and custody', 'A hard limit on the stake'] },
];
export const FACETS: Record<FacetId, Facet> = {
  lens:{name:'Lens',values:{chart:'Chart reader',business:'Business reader',story:'Story reader',system:'System builder'},about:{chart:'You read price and patterns first.',business:'You read the business behind the price.',story:'You follow themes, people and news early.',system:'You trust rules you have tested.'}},
  decide:{name:'Decisions',values:{rules:'Rules-based',judgement:'Judgement-based'},about:{rules:'You follow a plan you set in advance.',judgement:'You weigh each case as it comes.'}},
  risk:{name:'Risk',values:{guardian:'Guardian',balanced:'Balanced',bold:'Bold'},about:{guardian:'You protect what you have first.',balanced:'You take measured risks on purpose.',bold:'You accept big swings for big moves.'}},
  stage:{name:'Stage',values:{newcomer:'Newcomer',practising:'Practising',experienced:'Experienced'},about:{newcomer:'The book starts you from the ground up.',practising:'You know the basics and are building habits.',experienced:'You have real hours behind you.'}},
};
const TR: TrialClassId[] = ['shadow','duelist','vanguard','ranger','knight','warden'], IN: TrialClassId[] = ['arcanist','falconer','druid','cartographer','scout'];
const side = (t: number, i: number): Weights => Object.fromEntries([...TR.map(c=>[c,t]),...IN.map(c=>[c,i])]);
const O = (l: string, i: string, w: Weights, why: string, f: Weights = {}, flag?: string): Opt => ({ l, i, w, why, f, flag });

export const BANK: readonly Card[] = [
 // ---------- The fork: trader or investor (8) ----------
 {id:'F1',stage:'fork',sib:'F4',scene:'drop',q:'A stock you own drops 15%. No news.',sub:'What do you open first?',opts:[O('The price chart','chart',side(2,-1),'you look at price first',{'lens.chart':1}),O('The company report','book',side(-1,2),'you look at the business first',{'lens.business':1})]},
 {id:'F2',stage:'fork',sib:'F6',scene:'week',q:'Your ideal week in the markets',opts:[O('Short sessions, many decisions','bolt',{...side(2,-1),shadow:3,duelist:3,warden:0},'you like frequent decisions'),O('One long read, few decisions','lamp',{...side(-1,2),warden:1},'you like few, considered decisions')]},
 {id:'F3',stage:'fork',sib:'F5',scene:'own',q:'What would you rather own?',opts:[O('A position I’ll exit','door',side(2,-1),'you think in positions'),O('A slice of a business for years','house',{...side(-1,2),warden:1},'you think like an owner')]},
 {id:'F4',stage:'fork',sib:'F1',scene:'weekend',q:'Weekend. Markets are closed.',sub:'What sounds like a good hour?',opts:[O('Reviewing my trades','journal',side(2,-1),'you review trades for fun',{'decide.rules':1}),O('Reading about companies or funds','book',side(-1,2),'you read about investments for fun')]},
 {id:'F5',stage:'fork',sib:'F3',scene:'news',q:'Which headline grabs you?',opts:[O('“Price breaks its 52-week high”','arrowup',side(2,-1),'price moves grab you',{'lens.chart':1}),O('“Company doubles its profit”','coins',side(-1,2),'business results grab you',{'lens.business':1})]},
 {id:'F6',stage:'fork',sib:'F2',scene:'trophy',q:'A good year, to you, looks like…',opts:[O('Many trades, well executed','target',side(2,-1),'you measure success in execution'),O('A portfolio that grew quietly','seed',side(-1,2),'you measure success in growth over time')]},
 {id:'F7',stage:'fork',sib:'F8',scene:'clock',q:'When would you check your positions?',opts:[O('Several times a day','stopwatch',{...side(2,-2),warden:0,knight:0},'you check often'),O('Once a month is plenty','calendar',{...side(-1,2),warden:1,knight:1},'you check rarely')]},
 {id:'F8',stage:'fork',sib:'F7',scene:'calendar',q:'You can’t look at the market for two weeks.',opts:[O('That would bother me','bell',side(2,-1),'you want to stay close to the market'),O('Fine, nothing changes that fast','moon',side(-1,2),'two weeks away doesn’t worry you')]},
 // ---------- Trader style (20) ----------
 {id:'T1',stage:'style',branch:'trader',sib:'T10',scene:'clock',q:'How long would you hold a good trade?',opts:[O('Minutes','stopwatch',{shadow:4,duelist:1},'you hold for minutes'),O('Within the day, closed by evening','sun',{duelist:4,shadow:1,vanguard:1},'you close by evening'),O('A few days to a few weeks','calendar',{ranger:4,vanguard:2},'you hold days to weeks'),O('Months','moon',{knight:2,warden:3},'you hold for months')]},
 {id:'T2',stage:'style',branch:'trader',sib:'T13',scene:'screens',q:'Which chart would you keep open?',opts:[O('1-minute','tick',{shadow:4},'you read 1-minute charts',{'lens.chart':1}),O('5 to 15 minutes','bars',{duelist:4,vanguard:1},'you read intraday charts',{'lens.chart':1}),O('Hourly to daily','candle',{vanguard:3,ranger:3},'you read hourly and daily charts',{'lens.chart':1}),O('Weekly','mountain',{knight:2,warden:3},'you read weekly charts')]},
 {id:'T3',stage:'style',branch:'trader',sib:'T8',scene:'breakout',q:'A breakout fires on high volume.',opts:[O('Jump in with it','bolt',{vanguard:3,duelist:1},'you act on the breakout',{'decide.judgement':1}),O('Wait for a pullback','hourglass',{ranger:3,knight:1},'you wait for a better entry',{'decide.rules':1})]},
 {id:'T4',stage:'style',branch:'trader',sib:'T7',scene:'trend',q:'Which move do you want to catch?',opts:[O('Ride the trend until it ends','arrowup',{knight:3,warden:1},'you ride trends'),O('The bounce between two levels','zigzag',{ranger:3},'you trade between levels')]},
 {id:'T5',stage:'style',branch:'trader',sib:'T11',scene:'coins',q:'Which sounds better?',opts:[O('Tiny profits, many times a day','coins',{shadow:4,duelist:1},'you like many tiny wins'),O('One bigger move, less often','gem',{vanguard:1,ranger:1,knight:1,warden:1},'you prefer fewer, larger moves')]},
 {id:'T6',stage:'style',branch:'trader',sib:'T9',scene:'rules',q:'What tells you to get out?',opts:[O('A rule I set in advance','ruler',{knight:3,shadow:1,duelist:1},'your exits follow rules',{'decide.rules':2}),O('My reason for the trade no longer holds','scroll',{warden:3},'your exits follow your thesis',{'decide.judgement':2})]},
 {id:'T7',stage:'style',branch:'trader',sib:'T4',scene:'trend',q:'Price pulls back 5% in an uptrend.',opts:[O('Hold: trends breathe','shield',{knight:3,warden:1},'you sit through pullbacks'),O('Sell at resistance, buy at support','zigzag',{ranger:3},'you trade the swing')]},
 {id:'T8',stage:'style',branch:'trader',sib:'T3',scene:'breakout',q:'You missed the first leg of a big move.',opts:[O('Join if momentum holds','bolt',{vanguard:3,duelist:1},'you join strong momentum',{'risk.bold':1}),O('Let it go, wait for the next setup','hourglass',{ranger:2,knight:1,warden:1},'you let missed moves go',{'risk.guardian':1})]},
 {id:'T9',stage:'style',branch:'trader',sib:'T6',scene:'map',q:'How much of your plan is written down?',opts:[O('Exact entry, stop and size','ruler',{knight:2,shadow:2,duelist:1,ranger:1},'you write exact rules',{'decide.rules':2}),O('The big picture and why','scroll',{warden:3,ranger:1},'you write the big picture',{'decide.judgement':2})]},
 {id:'T10',stage:'style',branch:'trader',sib:'T1',scene:'dusk',q:'The market is closing.',sub:'Where are your trades?',opts:[O('All closed. Never overnight.','moonoff',{duelist:4,shadow:2},'you never hold overnight'),O('Still open if the plan says so','moon',{ranger:2,vanguard:1,knight:1,warden:1},'you hold overnight when it fits the plan')]},
 {id:'T11',stage:'style',branch:'trader',sib:'T5',scene:'trophy',q:'A good trading day is…',opts:[O('Twenty small trades, net up','coins',{shadow:3,duelist:2},'you like many small trades'),O('One trade that went as planned','target',{ranger:2,knight:1,vanguard:1,warden:1},'you like one good trade')]},
 {id:'T12',stage:'style',branch:'trader',sib:'T18',scene:'news',q:'Big news hits a stock you watch.',opts:[O('Trade the move within the hour','bolt',{duelist:3,vanguard:2},'you trade the news',{'lens.story':1}),O('Wait for the dust to settle','hourglass',{ranger:1,knight:2,warden:2},'you let news settle',{'lens.chart':1})]},
 {id:'T13',stage:'style',branch:'trader',sib:'T2',scene:'screens',q:'What would you watch most closely?',opts:[O('The order flow, second by second','eye',{shadow:4},'you watch order flow',{'lens.system':1}),O('Today’s high, low and opening range','sun',{duelist:4},'you watch the day’s levels',{'lens.chart':1}),O('Daily chart patterns','candle',{ranger:3,vanguard:2},'you watch daily patterns',{'lens.chart':1}),O('Moving averages over months','arrowup',{knight:3,warden:1},'you watch long averages',{'lens.system':1})]},
 {id:'T14',stage:'style',branch:'trader',sib:'T20',scene:'own',q:'Which suits you better?',opts:[O('A few positions held through a quarter','house',{warden:3},'you hold a few positions a long time',{'decide.judgement':1}),O('Add or cut as the trend says','ruler',{knight:3},'you follow the trend’s signals',{'decide.rules':1})]},
 {id:'T15',stage:'style',branch:'trader',sib:'T10',scene:'dusk',q:'A stock runs 9% today and looks strong.',opts:[O('Close it before the bell','moonoff',{duelist:3},'you close strong moves by the bell'),O('Hold it two or three days','calendar',{vanguard:3},'you let strong moves run a few days')]},
 {id:'T16',stage:'style',branch:'trader',sib:'T1',scene:'clock',q:'Your usual time in a trade',opts:[O('Seconds to a few minutes','stopwatch',{shadow:3},'seconds to minutes in a trade'),O('Minutes to a few hours','sun',{duelist:3},'minutes to hours in a trade')]},
 {id:'T17',stage:'style',branch:'trader',sib:'T6',scene:'rules',q:'Your strategy, before you use it',opts:[O('Tested on years of past data','gears',{knight:2,shadow:1},'you test strategies first',{'lens.system':2,'decide.rules':1}),O('Learned by watching and doing','eye',{ranger:1,vanguard:1,duelist:1,warden:1},'you learn by watching',{'lens.chart':1,'decide.judgement':1})]},
 {id:'T18',stage:'style',branch:'trader',sib:'T12',scene:'trend',q:'A sector is suddenly in the news every day.',opts:[O('Look for the strongest chart in it','candle',{vanguard:2,ranger:1},'you hunt the strongest chart',{'lens.chart':1}),O('Ask if it’s a lasting shift','scroll',{warden:2,knight:1},'you ask if a shift lasts',{'lens.story':2})]},
 {id:'T19',stage:'style',branch:'trader',sib:'T5',scene:'coins',q:'Trading costs and fees…',opts:[O('Matter a lot: I trade often','coins',{shadow:2,duelist:2},'costs matter because you trade often'),O('Matter little: I trade rarely','hourglass',{warden:2,knight:1,ranger:1},'costs matter little because you trade rarely')]},
 {id:'T20',stage:'style',branch:'trader',sib:'T14',scene:'map',q:'A trade goes nowhere for six weeks.',opts:[O('Fine, if my reason still holds','shield',{warden:3},'you wait out a slow trade'),O('Exit, the trend never came','door',{knight:2,ranger:1},'you exit a trade that goes nowhere')]},
 // ---------- Investor style (16) ----------
 {id:'I1',stage:'style',branch:'investor',sib:'I2',scene:'market',q:'What draws you to an investment?',opts:[O('A good business at a bargain price','tag',{arcanist:4},'bargains draw you',{'lens.business':1}),O('Steady payments every quarter','drop',{druid:4},'steady income draws you',{'lens.business':1}),O('A business growing very fast','rocket',{falconer:4},'fast growth draws you',{'lens.story':1}),O('The whole market, cheaply','globe',{cartographer:4},'owning the whole market draws you',{'lens.system':1})]},
 {id:'I2',stage:'style',branch:'investor',sib:'I1',scene:'reading',q:'Your favourite kind of reading',opts:[O('Annual reports and valuations','book',{arcanist:4},'you read valuations',{'lens.business':2}),O('Dividend histories','drop',{druid:4},'you read dividend histories',{'lens.business':1}),O('Product launches and growth numbers','rocket',{falconer:4},'you read growth numbers',{'lens.story':1}),O('Whitepapers and token supply','scroll',{scout:4},'you read whitepapers',{'lens.story':1})]},
 {id:'I3',stage:'style',branch:'investor',sib:'I12',scene:'frontier',q:'Which would you research tonight?',opts:[O('An early project, big unknowns','compass',{scout:3,falconer:1},'you research early projects',{'risk.bold':1}),O('A proven business, known numbers','book',{arcanist:2,druid:1,cartographer:1},'you research proven businesses',{'risk.guardian':1})]},
 {id:'I4',stage:'style',branch:'investor',sib:'I8',scene:'calendar',q:'Time you’d spend choosing investments',opts:[O('Almost none: buy a broad fund monthly','globe',{cartographer:4},'you want almost no picking',{'decide.rules':2}),O('Some: a few companies I follow','eye',{druid:2,falconer:1,arcanist:1},'you follow a few companies'),O('A lot: deep research','book',{arcanist:3,falconer:1,scout:1},'you love deep research',{'lens.business':1})]},
 {id:'I5',stage:'style',branch:'investor',sib:'I9',scene:'frontier',q:'A holding could go to zero or go 10x.',opts:[O('Interesting, with a small stake','compass',{scout:3},'you accept a small all-or-nothing stake',{'risk.bold':2}),O('Not for me','shield',{druid:2,cartographer:2,arcanist:1},'you avoid all-or-nothing bets',{'risk.guardian':2})]},
 {id:'I6',stage:'style',branch:'investor',sib:'I11',scene:'garden',q:'A company you own cuts its dividend.',opts:[O('Check if it’s still undervalued','tag',{arcanist:3},'value matters more than the payout'),O('Check if the income is still safe','drop',{druid:3},'the payout matters most')]},
 {id:'I7',stage:'style',branch:'investor',sib:'I9',scene:'trend',q:'A stock you own doubled in a year.',opts:[O('Sell: it’s no longer cheap','tag',{arcanist:3},'you sell when value is reached',{'decide.rules':1}),O('Hold: the growth isn’t done','rocket',{falconer:3},'you hold while growth lasts',{'decide.judgement':1})]},
 {id:'I8',stage:'style',branch:'investor',sib:'I4',scene:'trophy',q:'Beating the market, or matching it?',opts:[O('Matching it at low cost is enough','globe',{cartographer:4},'matching the market is enough'),O('I want to pick winners','target',{arcanist:1,falconer:2,scout:1},'you want to pick winners')]},
 {id:'I9',stage:'style',branch:'investor',sib:'I7',scene:'growth',q:'Not profitable yet, but sales grow 40% a year.',opts:[O('Interesting: growth first','rocket',{falconer:3,scout:1},'you back growth before profit',{'lens.story':1}),O('Pass: show me profits','coins',{arcanist:2,druid:2},'you want profits first',{'lens.business':1})]},
 {id:'I10',stage:'style',branch:'investor',sib:'I13',scene:'drop',q:'The whole market falls 25%.',opts:[O('Keep my monthly buy going','calendar',{cartographer:3,druid:1},'you keep buying through falls',{'decide.rules':2}),O('Hunt for bargains','tag',{arcanist:3},'you hunt bargains in falls',{'risk.balanced':1}),O('Check the growth stories still hold','rocket',{falconer:2},'you re-check growth stories'),O('Wait it out','hourglass',{druid:1,cartographer:1},'you wait out falls',{'risk.guardian':1})]},
 {id:'I11',stage:'style',branch:'investor',sib:'I6',scene:'garden',q:'What happens to the income?',opts:[O('Reinvest everything','seed',{falconer:1,cartographer:1,arcanist:1},'you reinvest everything'),O('One day, live on some of it','drop',{druid:3},'you want to live on the income one day')]},
 {id:'I12',stage:'style',branch:'investor',sib:'I3',scene:'frontier',q:'Which frontier interests you more?',opts:[O('Tokens and new networks','compass',{scout:3},'new networks interest you',{'lens.story':1}),O('Listed tech companies','rocket',{falconer:3},'listed tech interests you',{'lens.business':1})]},
 {id:'I13',stage:'style',branch:'investor',sib:'I10',scene:'news',q:'A scary headline about the economy.',opts:[O('Ignore it: my plan is for decades','globe',{cartographer:3},'headlines don’t change your plan',{'decide.rules':1}),O('Read on: it might create a bargain','tag',{arcanist:2,falconer:1},'headlines can mean bargains',{'lens.story':1})]},
 {id:'I14',stage:'style',branch:'investor',sib:'I11',scene:'garden',q:'Which holdings appeal to you more?',opts:[O('Mature companies that pay every year','drop',{druid:3},'you like steady payers'),O('Young companies that might grow very large','seed',{falconer:3},'you like fast growers')]},
 {id:'I15',stage:'style',branch:'investor',sib:'I5',scene:'purse',q:'How much of your investing goes to long shots?',opts:[O('None','shield',{cartographer:2,druid:2},'no long shots',{'risk.guardian':2}),O('A small slice','compass',{scout:2,falconer:1},'a small slice of long shots',{'risk.balanced':2}),O('A big part','flame',{scout:3},'a big part in long shots',{'risk.bold':2},'Large long-shot stakes need loss capacity first.')]},
 {id:'I16',stage:'style',branch:'investor',sib:'I1',scene:'reading',q:'Which number do you check first?',opts:[O('Price compared with earnings','tag',{arcanist:3},'you check value first',{'lens.business':1}),O('Sales growth','rocket',{falconer:3},'you check growth first',{'lens.business':1}),O('Dividend yield and cover','drop',{druid:3},'you check the dividend first',{'lens.business':1}),O('The fund’s yearly fee','globe',{cartographer:3},'you check the fee first',{'lens.system':1})]},
 // ---------- Life facts: change the scores, and say why (6; some conditional) ----------
 {id:'L1',stage:'life',scene:'clock',q:'Free time during market hours on a weekday?',opts:[O('Under an hour','hourglass',{shadow:-4,duelist:-4,vanguard:-3},'little market-hours time',{},'Fast styles need hours you said you don’t have.'),O('One to three hours','sun',{shadow:-2,duelist:-2,vanguard:-1},'some market-hours time'),O('Most of the day','stopwatch',{shadow:1,duelist:1,vanguard:1},'plenty of market-hours time'),O('Only evenings and weekends','moon',{shadow:-4,duelist:-4,vanguard:-4,ranger:-1,knight:1,warden:1,arcanist:1,druid:1,cartographer:1},'evenings and weekends only',{},'Fast styles need market hours.')]},
 {id:'L2',stage:'life',scene:'calendar',q:'How long can this money stay untouched?',opts:[O('Under a year','sun',{warden:-2,arcanist:-2,druid:-2,falconer:-2,cartographer:-3},'a short horizon',{},'Long-term styles conflict with needing the money soon.'),O('One to three years','calendar',{},'a medium horizon'),O('Five years or more','mountain',{warden:1,arcanist:2,druid:2,falconer:2,cartographer:3},'a long horizon')]},
 {id:'L3',stage:'life',scene:'purse',q:'If you lost this money entirely…',opts:[O('My bills would suffer','house',{scout:-4,shadow:-1,duelist:-1,vanguard:-1},'losses would hurt essentials',{'risk.guardian':1},'Keep it on paper for now: money for bills should not be at risk.'),O('I’d be fine','shield',{},'losses would not hurt essentials')]},
 {id:'L4',stage:'life',when:(s: Ctx)=>s.answered('L3',1),scene:'purse',q:'Do you have savings for emergencies?',sub:'About three months of expenses',opts:[O('Yes','shield',{},'you have an emergency fund'),O('Partly','hourglass',{scout:-1},'a partial emergency fund',{},'Build the emergency fund before risky practice with real money.'),O('Not yet','house',{scout:-3,duelist:-1,shadow:-1},'no emergency fund yet',{'risk.guardian':1},'Build the emergency fund first; practise on paper meanwhile.')]},
 {id:'L5',stage:'life',when:(s: Ctx)=>s.leaderSide()==='investor',scene:'garden',q:'Would you need income from this soon?',opts:[O('Yes, for regular bills','house',{druid:-1,scout:-2},'you need income soon',{},'Dividends can be cut. Don’t rely on them for essentials.'),O('No, it can grow','seed',{falconer:1,cartographer:1},'it can grow untouched')]},
 {id:'L6',stage:'life',when:(s: Ctx)=>['shadow','duelist','vanguard'].includes(s.leader()),scene:'coins',q:'Roughly how much would you start with?',sub:'Small amounts are fine. This only shapes the advice.',opts:[O('Under US$500','coins',{shadow:-2,duelist:-1},'a small starting amount',{},'With a small account, fees eat fast styles. Practise on paper first.'),O('US$500 to 5,000','purse',{},'a moderate starting amount'),O('More than US$5,000','gem',{},'a larger starting amount')]},
 // ---------- Experience: sets the stage facet (3) ----------
 {id:'E1',stage:'exp',scene:'trophy',q:'How long have you traded or invested?',opts:[O('Never yet','seed',{},'you are just starting',{'stage.newcomer':3}),O('Under a year','sun',{},'under a year of practice',{'stage.practising':2,'stage.newcomer':1}),O('One to three years','calendar',{},'one to three years of practice',{'stage.practising':3}),O('More than three years','mountain',{},'more than three years of practice',{'stage.experienced':3})]},
 {id:'E2',stage:'exp',when:(s: Ctx)=>!s.answered('E1',0),scene:'screens',q:'Which have you actually used?',sub:'Pick the most advanced',opts:[O('Just buy and hold','house',{},'you have bought and held',{'stage.newcomer':1,'stage.practising':1}),O('Limit and stop orders','ruler',{},'you have used limit and stop orders',{'stage.practising':2}),O('Leverage or futures','flame',{},'you have used leverage',{'stage.experienced':2,'risk.bold':1})]},
 {id:'E3',stage:'exp',when:(s: Ctx)=>!s.answered('E1',0),scene:'rules',q:'A stop-loss is…',sub:'A quick check, not a test',opts:[O('An order that sells if price falls to a level you set','check',{},'you know what a stop-loss does',{'stage.practising':1,'stage.experienced':1}),O('A guarantee you can’t lose more','question',{},'you were unsure what a stop-loss guarantees',{'stage.newcomer':2}),O('Not sure','question',{},'you were unsure about stop-losses',{'stage.newcomer':2})]},
 // ---------- Facet cards: asked only while a facet is unclear (9) ----------
 {id:'X1',stage:'facet',facet:'lens',sib:'X2',scene:'reading',q:'Before a decision, I mostly look at…',opts:[O('The chart','chart',{},'',{'lens.chart':3}),O('The business numbers','book',{},'',{'lens.business':3}),O('The story and the people','people',{},'',{'lens.story':3}),O('My tested rules','gears',{},'',{'lens.system':3})]},
 {id:'X2',stage:'facet',facet:'lens',sib:'X1',scene:'trend',q:'Which do you believe more?',opts:[O('Price tells me everything','chart',{},'',{'lens.chart':2}),O('Price follows the business','book',{},'',{'lens.business':2})]},
 {id:'X3',stage:'facet',facet:'lens',sib:'X1',scene:'news',q:'Which edge sounds more like you?',opts:[O('Spotting a big theme early','people',{},'',{'lens.story':2}),O('Rules I’ve tested on the past','gears',{},'',{'lens.system':2})]},
 {id:'X4',stage:'facet',facet:'decide',sib:'X5',scene:'rules',q:'Two of your signals disagree.',opts:[O('Follow the rule I set','ruler',{},'',{'decide.rules':2}),O('Use my judgement','scale',{},'',{'decide.judgement':2})]},
 {id:'X5',stage:'facet',facet:'decide',sib:'X4',scene:'map',q:'A checklist before every order…',opts:[O('Yes please','check',{},'',{'decide.rules':2}),O('Feels like a straitjacket','scroll',{},'',{'decide.judgement':2})]},
 {id:'R1',stage:'facet',facet:'risk',sib:'R2',scene:'breakout',q:'You’re up 22% in three weeks. Your target was 15%.',opts:[O('Take the profit, as planned','check',{},'you take profits as planned',{'risk.guardian':2,'decide.rules':1}),O('Take half, let half run','scale',{},'you take half and let half run',{'risk.balanced':2}),O('Let it all run','flame',{},'you let winners run',{'risk.bold':2})]},
 {id:'R2',stage:'facet',facet:'risk',sib:'R1',scene:'purse',q:'How much of your account would you put on one idea?',opts:[O('About 1%','shield',{},'you risk about 1% per idea',{'risk.guardian':2}),O('2 to 5%','scale',{},'you risk 2 to 5% per idea',{'risk.balanced':2}),O('10% or more','flame',{},'you risk 10% or more per idea',{'risk.bold':2},'Ten percent on one idea is a lot. Learn position sizing before you risk real money.')]},
 {id:'R3',stage:'facet',facet:'risk',sib:'R4',scene:'drop',q:'You’re down 8% and your plan says exit.',opts:[O('Exit as planned','ruler',{knight:1,ranger:1,shadow:1,duelist:1},'you follow your exit',{'decide.rules':2,'risk.guardian':1}),O('Wait for a bounce','hourglass',{},'you wait for a bounce',{'risk.bold':1},'Practise exits first: hold the plan, then review.'),O('Buy more, it’s cheaper','tag',{arcanist:1},'you add on drops',{'risk.bold':2},'Adding to a loser is a habit to test on paper first.')]},
 {id:'R4',stage:'facet',facet:'risk',sib:'R3',scene:'drop',q:'Your portfolio drops 20% in a month.',opts:[O('I’d sleep fine','moon',{},'a 20% drop wouldn’t rattle you',{'risk.bold':2}),O('Uneasy, but I’d hold','scale',{},'a 20% drop would unsettle you but you’d hold',{'risk.balanced':2}),O('I’d sell to stop the pain','door',{},'you’d sell after a 20% drop',{'risk.guardian':2})]},
 // ---------- Chart replays: watch, then decide (2) ----------
 {id:'P1',stage:'replay',scene:'replay:breakout',q:'Look at the chart, then decide.',sub:'Flat for weeks, then a breakout on high volume.',opts:[O('Enter now','bolt',{vanguard:2,duelist:1},'you entered the breakout',{'risk.bold':1,'lens.chart':1}),O('Wait for a retest','hourglass',{ranger:2,knight:1},'you waited for a retest',{'risk.balanced':1,'lens.chart':1}),O('Skip it','door',{warden:1,arcanist:1,cartographer:1},'you skipped the breakout',{'risk.guardian':1})]},
 {id:'P2',stage:'replay',scene:'replay:dip',q:'Look at the chart, then decide.',sub:'A sharp drop, then a bounce.',opts:[O('Buy the dip','tag',{arcanist:1,ranger:1},'you bought the dip',{'risk.bold':1}),O('Wait for the trend to turn','arrowup',{knight:2},'you waited for the trend to turn',{'decide.rules':1}),O('Stay out','shield',{cartographer:1,druid:1},'you stayed out',{'risk.guardian':1})]},
];

const IDS = TRIAL_CLASSES.map(c => c.id);
export const trialClass = (id: TrialClassId) => TRIAL_CLASSES.find(c => c.id === id)!;
export const card = (id: string) => BANK.find(c => c.id === id)!;
export const CAP = 22, MIN = 10;
const FACTS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'E1', 'E2', 'E3'];

// Everything below reads one state; nothing is stored here.
export function trial(state: TrialState) {
  const answers = state.answers.filter(a => BANK.some(c => c.id === a.id) && card(a.id).opts[a.o]);
  const answered = (id: string, o?: number) => answers.some(a => a.id === id && (o === undefined || a.o === o));
  function totals() {
    const s = Object.fromEntries(IDS.map(c => [c, 0])) as Record<TrialClassId, number>, f: Record<string, number> = {};
    for (const a of answers) { const o = card(a.id).opts[a.o]; for (const [c, v] of Object.entries(o.w)) s[c as TrialClassId] += v ?? 0; for (const [k, v] of Object.entries(o.f)) f[k] = (f[k] ?? 0) + (v ?? 0); }
    return { s, f };
  }
  // Softmax over class scores; 0.35 keeps early answers from deciding too fast.
  function probs() {
    const { s } = totals(), m = Math.max(...Object.values(s)), e = Object.fromEntries(IDS.map(c => [c, Math.exp((s[c] - m) * 0.35)])) as Record<TrialClassId, number>;
    const z = Object.values(e).reduce((a, b) => a + b, 0);
    return Object.fromEntries(IDS.map(c => [c, e[c] / z])) as Record<TrialClassId, number>;
  }
  const ranked = (p: Record<TrialClassId, number>) => IDS.map(c => ({ c, p: p[c] })).sort((a, b) => b.p - a.p);
  const favourite = (a: Answer): TrialClassId | null => { const best = Object.entries(card(a.id).opts[a.o].w).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0]; return best && (best[1] ?? 0) > 0 ? best[0] as TrialClassId : null; };
  const favFacet = (a: Answer) => Object.entries(card(a.id).opts[a.o].f).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0]?.[0] ?? null;
  function forkVotes() { let t = 0, i = 0; for (const a of answers) { if (card(a.id).stage !== 'fork') continue; const f = favourite(a); if (f && trialClass(f).side === 'trader') t++; else i++; } return { t, i }; }
  function branch() { const v = forkVotes(); return v.t - v.i >= 2 ? 'trader' as const : v.i - v.t >= 2 ? 'investor' as const : null; }
  const ctx: Ctx = { answered, leader: () => ranked(probs())[0].c, leaderSide: () => trialClass(ranked(probs())[0].c).side };
  const relevant = (c: Card) => !c.when || c.when(ctx);
  // Sibling cards ask the same thing another way; a disagreement adds two cards to the minimum.
  function sibChecks() {
    const out: { a: string; b: string; agree: boolean; stage: Stage }[] = [];
    for (const a of answers) {
      const c = card(a.id), b = c.sib ? answers.find(x => x.id === c.sib) : undefined;
      if (!b || answers.indexOf(b) > answers.indexOf(a)) continue;
      let agree: boolean;
      if (c.stage === 'facet') agree = favFacet(a) === favFacet(b);
      else { const fa = favourite(a), fb = favourite(b); agree = fa === fb || (c.stage === 'fork' && !!fa && !!fb && trialClass(fa).side === trialClass(fb).side); }
      out.push({ a: b.id, b: a.id, agree, stage: c.stage });
    }
    return out;
  }
  function facetState() {
    const { f } = totals(), out = {} as Record<FacetId, { vals: { v: string; s: number }[]; top: string | null; resolved: boolean; capped?: boolean }>;
    for (const [k, def] of Object.entries(FACETS) as [FacetId, Facet][]) {
      const vals = Object.keys(def.values).map(v => ({ v, s: f[`${k}.${v}`] ?? 0 })).sort((x, y) => y.s - x.s);
      const resolved = k === 'stage' ? answered('E1') : (vals[0].s >= 3 && vals[0].s - vals[1].s >= 2) || (vals[0].s >= 5 && vals[0].s > vals[1].s);
      out[k] = { vals, top: vals[0].s > 0 ? vals[0].v : null, resolved };
    }
    // Capacity caps temperament: bold shows as balanced when losses would hurt or there is no emergency fund.
    if ((answered('L3', 0) || answered('L4', 2)) && out.risk.top === 'bold') { out.risk.top = 'balanced'; out.risk.capped = true; }
    return out;
  }
  const factsDue = () => FACTS.filter(id => !answered(id) && relevant(card(id)));
  function classVerdict() {
    const p = probs(), r = ranked(p), checks = sibChecks();
    const confirmed = checks.some(c => c.agree && c.stage === 'style' && [favourite(answers.find(x => x.id === c.a)!), favourite(answers.find(x => x.id === c.b)!)].includes(r[0].c));
    const backing = answers.filter(x => card(x.id).stage === 'style' && favourite(x) === r[0].c).length;
    const clear = r[0].p >= 0.6 && r[0].p - r[1].p >= 0.3 && backing >= 2;
    return { p, r, checks, confirmed, backing, clear, classDone: clear && confirmed };
  }
  function nextCard(): Card | null {
    if (state.deeper) return BANK.find(c => c.stage === 'deeper' && !answered(c.id)) ?? null;
    const br = branch(), forks = answers.filter(a => card(a.id).stage === 'fork').length;
    if (!br && forks < 6) return BANK.find(c => c.stage === 'fork' && !answered(c.id)) ?? null;
    const styleAsked = answers.filter(a => card(a.id).stage === 'style').length, v = classVerdict(), r = v.r;
    if (styleAsked >= 3 || v.classDone) { const due = factsDue(); if (due.length) return card(due[0]); }
    if ((styleAsked >= 4 || v.classDone) && !answered('P1')) return card('P1');
    if (!v.classDone) {
      const [a, b] = [r[0].c, r[1].c];
      const pool = BANK.filter(c => c.stage === 'style' && !answered(c.id) && (!br || c.branch === br || trialClass(b).side !== trialClass(a).side));
      // Prefer the card that best separates the two leaders, and confirm the leader through a sibling first.
      const split = (c: Card) => { const vals = c.opts.map(o => (o.w[a] ?? 0) - (o.w[b] ?? 0)); return Math.max(...vals) - Math.min(...vals); };
      const unconfirmed = answers.filter(x => card(x.id).stage === 'style' && favourite(x) === a).map(x => card(x.id).sib).filter((id): id is string => !!id).map(card).filter(c => pool.includes(c));
      const cands = (unconfirmed.length ? unconfirmed : pool).slice().sort((x, y) => split(y) - split(x));
      if (cands.length && split(cands[0]) > 0) return cands[0];
      if (!answered('P2') && answers.length >= 12) return card('P2');
      if (cands.length) return cands[0];
    }
    const fs = facetState();
    for (const k of ['lens', 'decide', 'risk'] as const) if (!fs[k].resolved) { const c = BANK.find(c => c.stage === 'facet' && c.facet === k && !answered(c.id)); if (c) return c; }
    return null;
  }
  function verdict() {
    const v = classVerdict(), n = answers.length, contradicted = v.checks.filter(c => !c.agree).length, fs = facetState();
    const facetsDone = (['lens', 'decide', 'risk'] as const).every(k => fs[k].resolved || !BANK.some(c => c.stage === 'facet' && c.facet === k && !answered(c.id)));
    const factsDone = !factsDue().length && answered('P1');
    const minNow = MIN + 2 * contradicted;
    const done = !state.deeper && n >= minNow && v.classDone && facetsDone && factsDone;
    const capped = n >= CAP || !nextCard();
    const lead = v.r[0].c;
    const reasons = answers.filter(x => favourite(x) === lead).map(x => card(x.id).opts[x.o].why).filter(Boolean).slice(0, 4);
    const flags = [...new Set(answers.map(x => card(x.id).opts[x.o].flag).filter((f): f is string => !!f))];
    return { ...v, n, contradicted, fs, facetsDone, factsDone, minNow, done, capped, finished: (done || capped) && !(state.deeper && nextCard()), reasons, flags, forkVotes: forkVotes(), branch: branch() };
  }
  const deeperLeft = () => BANK.some(c => c.stage === 'deeper' && !answered(c.id));
  return { answers, nextCard, verdict, deeperLeft };
}

export const isTrialClass = (id: unknown): id is TrialClassId => typeof id === 'string' && IDS.includes(id as TrialClassId);
