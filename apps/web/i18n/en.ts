import type { Translations } from "./types"

export const en: Translations = {
  siteTitle: "SENQ \u2014 Prediction Market",
  siteDescription: "Japan's first attribute-weighted prediction market",

  nav: {
    market: "Markets",
    myPage: "My Page",
    mainNav: "Main navigation",
    connecting: "Connecting",
    connectingDots: "Connecting...",
    installMetaMask: "Install MetaMask",
    connectWallet: "Connect Wallet",
  },

  hero: {
    headline1: "Super Collective Intelligence.",
    headline2: "Japan-Native Prediction Market",
    description:
      "Achieve highly accurate predictions even with thin liquidity through our unique attribute-weighting technology. A prediction market focused on Japanese themes where anyone can participate with confidence.",
  },

  filter: {
    categories: {
      all: "All",
      politics: "Politics",
      economy: "Economy",
      local: "Local",
      culture: "Culture",
      tech: "Tech",
    },
    statuses: {
      all: "All",
      open: "Open",
      closed: "Closed",
      resolved: "Resolved",
    },
    categoryFilter: "Category filter",
    statusFilter: "Status filter",
  },

  marketCard: {
    statusOpen: "Open",
    statusClosed: "Closed",
    statusResolved: "Resolved",
    marketAria: (title) => `Market: ${title}`,
    totalVolume: "Volume:",
  },

  marketsGrid: {
    loadError: "Failed to load markets",
    noMarkets: "No matching markets found",
  },

  outcomesList: {
    title: "Outcomes & Current Probabilities",
  },

  betPanel: {
    selected: "Selected",
    selectOutcome: "Click an outcome to select",
    betAmount: "Bet Amount (JPYC)",
    selectOutcomeError: "Please select an outcome",
    enterAmountError: "Please enter an amount",
    insufficientBalance: "Insufficient balance",
    txRejected: "Transaction was rejected",
    betFailed: "Bet failed",
    available: "Available:",
    loading: "Loading...",
    insufficientShort: "(insufficient)",
    yourWeightScore: "Your Weight Score",
    weightDescription:
      "Your prediction weight increases when your attributes are relevant to the market",
    betAmountLabel: "Bet Amount",
    weightScoreLabel: "Weight Score",
    effectiveBet: "Effective Bet",
    processing: "Processing...",
    betCompleted: "Prediction complete \u2713",
    connectWallet: "Connect Wallet",
    predict: "Predict",
  },

  marketInfoBox: {
    title: "Market Info",
    totalVolume: "Total Volume",
    participantsLabel: "Participants",
    participants: (n) => `${n}`,
    createdDate: "Created",
    endDate: "Deadline",
  },

  activeBets: {
    title: "Active Predictions",
    noBets: "No predictions yet",
    viewMarkets: "View Markets",
    prediction: "Prediction:",
    statusOpen: "Open",
    statusClosed: "Closed",
    betAmount: "Bet: ",
    weight: "Weight: ",
    effectiveAmount: "Effective: ",
    currentProbability: "Current probability",
  },

  profileSection: {
    profile: "Profile",
    myPage: "My Page",
    disconnect: "Disconnect",
    balance: "Balance",
    totalWeightScore: "Weight Score",
    betCount: "Bets",
    totalStake: "Total Staked",
    effectiveTotal: "Effective total:",
  },

  attributeManagement: {
    title: "Your Attributes",
    description:
      "Attributes are the basis for weight scores that affect prediction accuracy in markets",
    typeRegion: "Region",
    typeExpertise: "Expertise",
    typeExperience: "Experience",
    verified: "Verified",
    delete: "Delete",
    noAttributes: "No attributes registered yet",
    addAttribute: "Add Attribute",
    typeLabel: "Type",
    labelLabel: "Label",
    labelPlaceholder: "e.g. Lives in Tokyo",
    weightLabel: "Weight",
    add: "Add",
    cancel: "Cancel",
    weightExplanation:
      "Weight score calculation: Base score of 1.0 plus each attribute's weight coefficient minus 1.0. Region: \u00d71.3, Expertise: \u00d71.0, Experience: \u00d70.8 (Score range: 0.5\u20133.0)",
  },

  marketDetail: {
    notFound: "Market not found",
    backToList: "\u2190 Back to Markets",
    backToListShort: "\u2190 Markets",
    statusOpen: "Open",
    statusClosed: "Closed",
    statusResolved: "Resolved",
    statusDraft: "Draft",
    recentBets: "Recent Bets",
    marketIs: (status) => `This market is ${status}`,
    result: "Result:",
    claimAmount: "Your payout",
    claimPayout: "Claim Payout",
    claiming: "Claiming...",
    claimSuccess: "Payout claimed successfully!",
  },

  myPage: {
    title: "My Page",
    connectPrompt: "Connect your wallet to view your portfolio",
    connectingDots: "Connecting...",
    connectWallet: "Connect Wallet",
  },

  activity: {
    connectWallet: "Connect Wallet",
    connectPrompt: "Connect MetaMask to view your activity history.",
    installMetaMask: "Install MetaMask",
    connectingDots: "Connecting...",
    connectMetaMask: "Connect MetaMask",
    title: "Activity",
    betHistory: "Bet History",
    recentActivity: "Recent Activity",
    noActivity: "No activity yet",
    placeFirstBet: "Place Your First Bet",
  },

  admin: {
    title: "Admin Panel",
    login: "Login",
    statusDraft: "Draft",
    statusOpen: "Open",
    statusClosed: "Closed",
    statusResolved: "Resolved",
    inputError: "Input Error",
    fillRequired: "Please fill in all required fields",
    success: "Success",
    marketPublished: "Market has been published!",
    error: "Error",
    createFailed: "Failed to create market",
    createMarket: "Create Market",
    newMarket: "Create New Market",
    enterMarketInfo: "Enter market information",
    titleLabel: "Title *",
    titlePlaceholder: "Market title",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Description text",
    categoryLabel: "Category",
    categoryPlaceholder: "Select a category",
    deadlineLabel: "Deadline *",
    outcomesLabel: "Outcomes * (minimum 2)",
    outcomePlaceholder: (n) => `Outcome ${n}`,
    deleteOutcome: "Delete",
    addOutcome: "Add Outcome",
    cancel: "Cancel",
    creating: "Creating...",
    resolveMarket: "Resolve Market",
    selectWinningOutcome: "Select winning outcome",
    selectOutcome: "Select outcome",
    resolving: "Resolving...",
    resolve: "Resolve",
    marketResolved: "Market has been resolved",
    resolveFailed: "Failed to resolve",
    marketClosedSuccess: "Market has been closed",
    operationFailed: "Operation failed",
    closeMarket: "Close",
    confirmResolve: "Resolve",
    noMarkets: "No markets found",
    tableId: "ID",
    tableTitle: "Title",
    tableStatus: "Status",
    tableDeadline: "Deadline",
    tableActions: "Actions",
    connectMetaMask: "Connect MetaMask",
    logout: "Logout",
    marketList: "Market List",
    loadingDots: "Loading...",
    refresh: "Refresh",
    fetchFailed: "Failed to fetch",
  },

  learn: {
    title: "Learn",
    subtitle:
      "Understand how prediction markets work and become a better trader",
    guides: {
      eventContracts: {
        title: "What are Event Contracts?",
        description:
          "Learn about the basics of trading on real-world events and how contracts work.",
      },
      firstTrade: {
        title: "How to Place Your First Trade",
        description:
          "Step-by-step guide to buying and selling contracts on SENQ.",
      },
      risk: {
        title: "Understanding Risk",
        description:
          "Learn about the risks involved in trading and how to manage your portfolio.",
      },
      resolution: {
        title: "Market Resolution",
        description:
          "How markets are resolved and when you get paid out on winning positions.",
      },
      strategies: {
        title: "Advanced Strategies",
        description:
          "Tips and strategies for more experienced traders looking to optimize returns.",
      },
      faq: {
        title: "FAQ",
        description:
          "Frequently asked questions about SENQ and prediction markets.",
      },
    },
    videoTutorials: "Video Tutorials",
    gettingStarted: "Getting Started with SENQ",
    gettingStartedMeta: "5 min \u00b7 Beginner",
    marketPrices: "Understanding Market Prices",
    marketPricesMeta: "8 min \u00b7 Intermediate",
    videoPlaceholder: "Video placeholder",
  },

  positionBox: {
    title: "Your Positions",
    betAmount: "Bet Amount",
    weightScore: "Weight Score",
    effectiveBet: "Effective Bet",
  },

  format: {
    expired: "Expired",
    daysHours: (d, h) => `${d}d ${h}h left`,
    hours: (h) => `${h}h left`,
    minutes: (m) => `${m}m left`,
  },

  userContext: {
    addAttributeFailed: "Failed to add attribute",
    deleteAttributeFailed: "Failed to delete attribute",
  },
}
