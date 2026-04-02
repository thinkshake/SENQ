export type Locale = "ja" | "en"

export interface Translations {
  siteTitle: string
  siteDescription: string

  nav: {
    market: string
    myPage: string
    mainNav: string
    connecting: string
    connectingDots: string
    installMetaMask: string
    connectWallet: string
  }

  hero: {
    headline1: string
    headline2: string
    description: string
  }

  filter: {
    categories: {
      all: string
      politics: string
      economy: string
      local: string
      culture: string
      tech: string
    }
    statuses: {
      all: string
      open: string
      closed: string
      resolved: string
    }
    categoryFilter: string
    statusFilter: string
  }

  marketCard: {
    statusOpen: string
    statusClosed: string
    statusResolved: string
    marketAria: (title: string) => string
    totalVolume: string
  }

  marketsGrid: {
    loadError: string
    noMarkets: string
  }

  outcomesList: {
    title: string
  }

  betPanel: {
    selected: string
    selectOutcome: string
    betAmount: string
    selectOutcomeError: string
    enterAmountError: string
    insufficientBalance: string
    txRejected: string
    betFailed: string
    available: string
    loading: string
    insufficientShort: string
    yourWeightScore: string
    weightDescription: string
    betAmountLabel: string
    weightScoreLabel: string
    effectiveBet: string
    processing: string
    betCompleted: string
    connectWallet: string
    predict: string
  }

  marketInfoBox: {
    title: string
    totalVolume: string
    participantsLabel: string
    participants: (n: number) => string
    createdDate: string
    endDate: string
  }

  activeBets: {
    title: string
    noBets: string
    viewMarkets: string
    prediction: string
    statusOpen: string
    statusClosed: string
    betAmount: string
    weight: string
    effectiveAmount: string
    currentProbability: string
  }

  profileSection: {
    profile: string
    myPage: string
    disconnect: string
    balance: string
    totalWeightScore: string
    betCount: string
    totalStake: string
    effectiveTotal: string
  }

  attributeManagement: {
    title: string
    description: string
    typeRegion: string
    typeExpertise: string
    typeExperience: string
    verified: string
    delete: string
    noAttributes: string
    addAttribute: string
    typeLabel: string
    labelLabel: string
    labelPlaceholder: string
    weightLabel: string
    add: string
    cancel: string
    weightExplanation: string
  }

  marketDetail: {
    notFound: string
    backToList: string
    backToListShort: string
    statusOpen: string
    statusClosed: string
    statusResolved: string
    statusDraft: string
    recentBets: string
    marketIs: (status: string) => string
    result: string
    claimAmount: string
    claimPayout: string
    claiming: string
    claimSuccess: string
  }

  myPage: {
    title: string
    connectPrompt: string
    connectingDots: string
    connectWallet: string
  }

  activity: {
    connectWallet: string
    connectPrompt: string
    installMetaMask: string
    connectingDots: string
    connectMetaMask: string
    title: string
    betHistory: string
    recentActivity: string
    noActivity: string
    placeFirstBet: string
  }

  admin: {
    title: string
    login: string
    statusDraft: string
    statusOpen: string
    statusClosed: string
    statusResolved: string
    inputError: string
    fillRequired: string
    success: string
    marketPublished: string
    error: string
    createFailed: string
    createMarket: string
    newMarket: string
    enterMarketInfo: string
    titleLabel: string
    titlePlaceholder: string
    descriptionLabel: string
    descriptionPlaceholder: string
    categoryLabel: string
    categoryPlaceholder: string
    deadlineLabel: string
    outcomesLabel: string
    outcomePlaceholder: (n: number) => string
    deleteOutcome: string
    addOutcome: string
    cancel: string
    creating: string
    resolveMarket: string
    selectWinningOutcome: string
    selectOutcome: string
    resolving: string
    resolve: string
    marketResolved: string
    resolveFailed: string
    marketClosedSuccess: string
    operationFailed: string
    closeMarket: string
    confirmResolve: string
    noMarkets: string
    tableId: string
    tableTitle: string
    tableStatus: string
    tableDeadline: string
    tableActions: string
    connectMetaMask: string
    logout: string
    marketList: string
    loadingDots: string
    refresh: string
    fetchFailed: string
  }

  learn: {
    title: string
    subtitle: string
    guides: {
      eventContracts: { title: string; description: string }
      firstTrade: { title: string; description: string }
      risk: { title: string; description: string }
      resolution: { title: string; description: string }
      strategies: { title: string; description: string }
      faq: { title: string; description: string }
    }
    videoTutorials: string
    gettingStarted: string
    gettingStartedMeta: string
    marketPrices: string
    marketPricesMeta: string
    videoPlaceholder: string
  }

  positionBox: {
    title: string
    betAmount: string
    weightScore: string
    effectiveBet: string
  }

  format: {
    expired: string
    daysHours: (d: number, h: number) => string
    hours: (h: number) => string
    minutes: (m: number) => string
  }

  userContext: {
    addAttributeFailed: string
    deleteAttributeFailed: string
  }
}
