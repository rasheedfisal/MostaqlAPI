const { renderTapCard, Theme, Currencies, Direction, Edges, Locale } =
  window.CardSDK;
const { unmount } = renderTapCard("card-sdk-id", {
  publicKey: "pk_test_zvsBYbu71Wxh0ZPtFSjr5OnK", // Tap's public key
  transaction: {
    amount: 500,
    currency: Currencies.SAR,
  },
  customer: {
    id: "", //Tap's customer ID with syntax cus_xxx
    name: [
      {
        lang: Locale.AR,
        first: "alrasheed",
        last: "mohammed",
        middle: "faisal",
      },
    ],
    nameOnCard: "Alrasheed Faisal Mohammed",
    editable: false,
    contact: {
      email: "alrasheed@gmail.com",
      phone: {
        countryCode: "971",
        number: "52999944",
      },
    },
  },
  acceptance: {
    supportedBrands: ["AMERICAN_EXPRESS", "VISA", "MASTERCARD", "MADA"], //Remove the ones that are NOT enabled on your Tap account
    supportedCards: "ALL", //To accept both Debit and Credit
  },
  fields: {
    cardHolder: true,
  },
  addons: {
    displayPaymentBrands: true,
    loader: true,
    saveCard: true,
  },
  interface: {
    locale: Locale.AR,
    theme: Theme.LIGHT,
    edges: Edges.CURVED,
    direction: Direction.RTL,
  },
  onReady: () => console.log("onReady"),
  onFocus: () => console.log("onFocus"),
  onBinIdentification: (data) => console.log("onBinIdentification", data),
  onValidInput: (data) => console.log("onValidInputChange", data),
  onInvalidInput: (data) => console.log("onInvalidInput", data),
  onError: (data) => console.log("onError", data),
  onSuccess: (data) => console.log("onSuccess", data),
});
